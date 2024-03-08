from django.db import models
from django.contrib.auth.models import User

import paramiko
import requests
from urllib3.exceptions import InsecurePlatformWarning
from urllib3.exceptions import InsecureRequestWarning
import logging


requests.packages.urllib3.disable_warnings(InsecurePlatformWarning)
requests.packages.urllib3.disable_warnings(InsecureRequestWarning)


def get_header(ip):
    """
    building the authv2 URL. This method performs login to switch using ip. admin/switch is
    used to login and get an Authv2 header. Authentication Token is stored in header for
    subsequent queries.
    :param ip:
    :return:
    """
    authv2_url = "https://%s?domain=authv2&username=admin&password=switch" % (str(ip))

    # setting the header for the authentication request
    auth_headers = {'ACCEPT': 'application/vnd.alcatellucentaos+json; version=1.0'}

    # sending the authentication request to the switch
    try:
        r = requests.get(authv2_url, headers=auth_headers, verify=False)

        if r.status_code == 200:  # OK
            body = r.json()
            if "result" not in body or "data" not in body["result"]:
                print('Invalid response body - data not found')
                exit()

            if "token" not in body["result"]["data"]:
                print('Invalid response body - token not found')
                return False, None

            token = body["result"]["data"]["token"]
            query_header = {'ACCEPT': 'application/vnd.alcatellucentaos+json; version=1.0',
                            "Authorization": "Bearer " + token}
            return True, query_header
        else:  # NOT OK
            print('An error has occurred. ' + r.status_code)
            return False, None
    except Exception as e:
        print('An error has occurred. ' + str(e))
        return False, None


def cli(ip,header, cmd):
    query_url = "https://{}?domain=cli&cmd={}".format(ip, cmd)
    r = requests.get(query_url, headers=header, verify=False)
    print(cmd)
    if r.status_code == 200:  # OK
        output = r.json()['result']['output']
        error = r.json()['result']['error']

        if len(error)>0:
            raise Exception('Error field')
        else:
            return output

    else:  # NOT OK
        if "The service-id does not exist" in r.json()['result']['error']:
            print("OK")
            return 
        error_message = f"Command: {cmd}, Status Code: {r.status_code}, IP: {ip}, Response: {r.json()['result']['error']}"
        logging.error(error_message)
        raise Exception('Unknown error code ' + str(r.status_code))



class Reservation(models.Model):
    id = models.AutoField(primary_key=True)
    end = models.DateTimeField()
    creator =  models.ForeignKey(User, models.CASCADE, null=False)
    name = models.CharField(max_length=125)
    purpose = models.CharField(max_length=1024, blank=True, null=True)

    def unlinkAll(self):
        duts = Dut.objects.filter(reserv=self.id)
        for dut in duts:
            dut.unlink()

    class Meta:
        managed = False
        db_table = 'reservations'


class Dut(models.Model):
    id = models.IntegerField(primary_key=True)
    ip_mgnt = models.CharField(max_length=15)
    model = models.CharField(max_length=30)
    console = models.CharField(max_length=30, blank=True, null=True)
    reserv = models.ForeignKey(Reservation, models.SET_NULL, blank=True, null=True)
    positionX = models.FloatField(null=True, blank=True)
    positionY = models.FloatField(null=True, blank=True)
    TV_ID = models.IntegerField(primary_key=True)
    username = models.CharField(max_length=30)
    password = models.CharField(max_length=30)
    type=models.CharField(max_length=30)

    def changeBanner(self):
        user = "nobody" if self.reserv is None else self.reserv.creator
        text = """
        ***************** CENTRAL LAB RESERVATION SYSTEM ******************
        This switch is reserved by : {}
        If you access this switch without reservation, please contact admin

        """.format(user)
        print("change_banner")
        try:
            with paramiko.SSHClient() as ssh:
                # This script doesn't work for me unless the following line is added!
                ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy()) 
                ssh.connect(self.ip_mgnt, username='admin', password='switch', port=22, timeout=1)

                ftp = ssh.open_sftp()
                file=ftp.file('switch/pre_banner.txt', "w", -1)
                file.write(text)
                file.flush()
                ftp.close()
                return True
            
        except Exception as e:
            print(e)
            return False
        
    def cleanup(self):
        print("clean_dut")

        try:
            with paramiko.SSHClient() as ssh:
                # This script doesn't work for me unless the following line is added!
                ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy()) 
                ssh.connect(self.ip_mgnt, username='admin', password='switch', port=22, timeout=1)
                stdin, stdout,_ = ssh.exec_command("cp -r init/* working")
                stdout.channel.recv_exit_status()

        except Exception as e:
            print(e)
            return False


        header = get_header(self.ip_mgnt)
        if header[0] : 
            header = header[1]
        else:
            print('cannot auth to ' + self.ip_mgnt)
            return False
        # try :
        #     cli(self.ip_mgnt,header, "reload from working no rollback-timeout")
        #     return True
        # except Exception as e:
        #     print(e)
        #     return False

    def unlink(self):
        self.reserv = None
        self.save()
        self.changeBanner()
        self.cleanup()

    def link(self, reservation_id):
        self.reserv = reservation_id
        self.save()
        self.changeBanner()

    def resetConfig(self):
        print("resetting")
        print(self.id)

        try:
            with paramiko.SSHClient() as ssh:
                ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
                ssh.connect(self.ip_mgnt, username='admin', password='switch', port=22, timeout=10)

                commands = [
                    "write memory",
                    "cp /flash/working/vcboot.cfg /flash/working/vcboot_previous.cfg",
                    "cp /flash/working/vcsetup.cfg /flash/working/vcsetup_previous.cfg",
                    "cp /flash/remotelab/vcboot_default.cfg /flash/working/vcboot.cfg",
                    "cp /flash/remotelab/vcsetup_default.cfg /flash/working/vcsetup.cfg",
                    "echo y | reload from working no rollback"
                ]

                for cmd in commands:
                    stdin, stdout, stderr = ssh.exec_command(cmd)
                    exit_status = stdout.channel.recv_exit_status()
                    if exit_status != 0:
                        print(f"Command '{cmd}' failed with exit status {exit_status}")
                        return False

                return True

        except Exception as e:
            print(f"SSH connection or command execution failed: {e}")
            return False



    class Meta:
        managed = False
        db_table = 'dut'


class Link(models.Model):

    id = models.AutoField(primary_key=True)
    targetID = models.IntegerField()
    core_ip = models.CharField(max_length=15)
    source_port = models.CharField(max_length=10)
    source_dut_port = models.CharField(max_length=10)
    target_dut_port = models.CharField(max_length=10)
    source = models.ForeignKey(Dut, on_delete=models.CASCADE, db_column='source', related_name='source_links')
    target = models.ForeignKey(Dut, on_delete=models.CASCADE, db_column='target', related_name='target_links')
    service = models.IntegerField(blank=True, null=True)


    def create_first_tunnel(self, bvlan, service_nbr):
        bvlan = str(bvlan)
        service_nbr = str(service_nbr)
        header = get_header(self.core_ip)
        if header[0] : 
            header = header[1]
        else:
            print('cannot auth to ' + self.core_ip)
            return False
        try :
            cli(self.core_ip,header, "no service spb {0}".format(service_nbr))
            cli(self.core_ip,header, "service spb {0} isid {0} bvlan {1}".format(service_nbr, bvlan))
            cli(self.core_ip,header, "service spb {0} admin-state enable".format(service_nbr))
            cli(self.core_ip,header, "service {0} pseudo-wire enable".format(service_nbr))
            cli(self.core_ip,header, "service l2profile 'spbbackbone' 802.1x tunnel 802.1ab peer")
            cli(self.core_ip,header, "service access port {0} vlan-xlation enable l2profile 'spbbackbone'".format(self.source_port))
            cli(self.core_ip,header, "service {0} sap port {1}:all".format(service_nbr, self.source_port))
            cli(self.core_ip,header, "interfaces port {0} admin-state enable".format(self.source_port))
            # cli(self.core_ip,header, "write memory")
            return True
        except Exception as e:
            print(e)
            return False
        
    def create_second_tunnel(self, bvlan, service_nbr):
        bvlan = str(bvlan)
        service_nbr = str(service_nbr)
        header = get_header(self.core_ip)
        if header[0] : 
            header = header[1]
        else:
            print('cannot auth to ' + self.core_ip)
            return False
        try :
            cli(self.core_ip,header, "service spb {0} isid {0} bvlan {1}".format(service_nbr, bvlan))
            cli(self.core_ip,header, "service spb {0} admin-state enable".format(service_nbr))
            cli(self.core_ip,header, "service {0} pseudo-wire enable".format(service_nbr))
            cli(self.core_ip,header, "service l2profile 'spbbackbone' 802.1x tunnel 802.1ab peer")
            cli(self.core_ip,header, "service access port {0} vlan-xlation enable l2profile 'spbbackbone'".format(self.source_port))
            cli(self.core_ip,header, "service {0} sap port {1}:all".format(service_nbr, self.source_port))
            cli(self.core_ip,header, "interfaces port {0} admin-state enable".format(self.source_port))
            # cli(self.core_ip,header, "write memory")
            return True
        except Exception as e:
            print(e)
            return False
        
    def delete_tunnel(self, service_nbr):
        service_nbr = str(service_nbr)
        
        header = get_header(self.core_ip)
        if header[0] : 
            header = header[1]
        else:
            return False
        print("delete_tunnel")
        try :
            cli(self.core_ip,header, "no service {0} sap port {1}:all".format(service_nbr, self.source_port))
            cli(self.core_ip,header, "service spb {0} admin-state disable".format(service_nbr))
            cli(self.core_ip,header, "interfaces port {0} admin-state disable".format(self.source_port))
            # cli(self.core_ip,header, "write memory")

            return True
        except Exception as e:
            print(e)
            return False
        
    def removeService(self, service_nbr):
        service_nbr = str(service_nbr)
        
        header = get_header(self.core_ip)
        if header[0] : 
            header = header[1]
        else:
            return False
        try :
            cli(self.core_ip,header, "no service spb {0}".format(service_nbr))
            print("Removed {}".format(service_nbr))

            return True
        except Exception as e:
            print(e)
            return False


    def setService(self, service, bvlan, num):
        if num==0:
            if self.create_first_tunnel(bvlan, service):
                print("Set first service {0}".format(service))
                self.service = service
                self.save()
                return True
        elif num==1:
            if self.create_second_tunnel(bvlan, service):
                print("Set second service {0}".format(service))
                self.service = service
                self.save()
        return False
    
    def deleteService(self, num):
        if num ==0:
            if self.delete_tunnel(self.service):
                self.service = None
                self.save()
                return True
        else:
            if self.delete_tunnel(self.service) and self.removeService(self.service):
                self.service = None
                self.save()
                return True
        return False

    class Meta:
        managed = False
        db_table = 'links'



