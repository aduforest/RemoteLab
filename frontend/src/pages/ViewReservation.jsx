import React, { useState, useEffect, useRef } from 'react';
import { Header } from "../components";
import Axios from "../Axios";
import { useAuthHeader } from 'react-auth-kit';
import { useParams } from 'react-router-dom';
import * as d3 from 'd3';
import { useNavigate } from 'react-router-dom';

export default function ViewReservation() {
  const [reservation, setReservation] = useState(null);
  const [duts, setDuts] = useState([]);
  const authHeader = useAuthHeader();
  const { id } = useParams();
  const [dutLinks, setDutLinks] = useState({});
  const [availablePorts, setAvailablePorts] = useState({});
  const [showDropdown, setShowDropdown] = useState(null);
  const dropdownRef = useRef(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [showNodeSlideOver, setShowNodeSlideOver] = useState(false);
  const [selectedDropdownLink, setSelectedDropdownLink] = useState(null);
  const [connectMode, setConnectMode] = useState(false);
  const connectModeRef = useRef(connectMode);
  const redirect = useNavigate();
  const [selectedConnectA, setSelectedNodeA] = useState(null);
  const [selectedConnectB, setSelectedNodeB] = useState(null);
  const [selectedPortA, setSelectedPortA] = useState(null);
  const [selectedPortB, setSelectedPortB] = useState(null);
  const [selectedLink, setSelectedLink] = useState(null);
  const [similarLinks, setSimilarLinks] = useState([]);
  const [canvasWidth, setCanvasWidth] = useState(window.innerWidth * 0.69);
  const [canvasHeight, setCanvasHeight] = useState(window.innerHeight * 0.8);

  useEffect(() => {
    connectModeRef.current = connectMode;
  }, [connectMode]);
  
  useEffect(() => {
    const handleResize = () => {
      setCanvasWidth(window.innerWidth * 0.69);
    };
  
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setCanvasHeight(window.innerHeight * 0.8);
    };
  
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  
  const panelWidth = (window.innerWidth - canvasWidth)/2;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);


  

  const fetchData = async () => {
    try {
      const reservationResponse = await Axios.get(`get_reservation/${id}/`, {
        headers: {
          'Authorization': authHeader()
        }
      });
      setReservation(reservationResponse.data);

      const dutsResponse = await Axios.get(`list_dut/?reserv=${id}`, {
        headers: {
          'Authorization': authHeader()
        }
      });
      const fetchedDuts = dutsResponse.data.duts.map(dut => {
        return {
          ...dut,
          x: dut.positionX,
          y: dut.positionY
        };
      });
      setDuts(fetchedDuts);
      
      setDuts(fetchedDuts);

      const linkResponses = await Promise.all(fetchedDuts.map(dut => 
        Axios.get(`list_link/?dut=${dut.id}`, {
          headers: {
            'Authorization': authHeader()
          }
        })
      ));

      const links = {};
      const ports = {};
      linkResponses.forEach((response, index) => {
        links[fetchedDuts[index].id] = response.data.connected;
        ports[fetchedDuts[index].id] = response.data.available;
      });
      setDutLinks(links);
      setAvailablePorts(ports);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };
  
  useEffect(() => {
    fetchData();
  }, [id]);
  


  useEffect(() => {
    const nodeGroups = d3.select("#dutMap").selectAll("g.node-group");
    nodeGroups.select("rect")
      .attr("stroke-width", d => {
        if (connectMode) {
          return (selectedConnectA === d || selectedConnectB === d) ? "3" : "1";
        } else {
          return selectedNode === d ? "3" : "0";
        }
      })
      .attr("stroke", d => {
        if (connectMode) {
          return (selectedConnectA === d || selectedConnectB === d) ? "blue" : "grey";
        } else {
          return selectedNode === d ? "purple" : "none";
        }
      })
      .attr("stroke-dasharray", d => {
        if (connectMode && (selectedConnectA === d || selectedConnectB === d)) {
          return "none";
        } else {
          return "5,5";
        }
      });
  }, [selectedNode, connectMode, selectedConnectA, selectedConnectB]); 
  
  const handleConnect = async () => {
    if (selectedPortA && selectedPortB) {
      try {
        const response = await Axios.post("connect/", {
          links: [
            {
              portA: selectedPortA.id,
              portB: selectedPortB.id
            }
          ]
        }, {
          headers: {
            'Authorization': authHeader()
          }
        });
  
        if (response.status === 200) {
          console.log(response.data);
          setConnectMode(false);
          setSelectedNodeA(null);
          setSelectedNodeB(null);
          fetchData();
        } else {
          console.error("Failed to connect:", response.data);
        }
      } catch (error) {
        console.error("Error connecting:", error);
      }
    } else {
      console.error("Ports not selected");
    }
  }; 

  const handleDisconnect = async () => {
    if (selectedLink) {
      try {
        const response = await Axios.post("disconnect/", {
          links: [
            {
              portA: selectedLink.ID,
              portB: selectedLink.targetID
            }
          ]
        }, {
          headers: {
            'Authorization': authHeader()
          }
        });
  
        if (response.status === 200) {
          console.log(response.data);
          setSelectedLink(null);
          fetchData();
        } else {
          console.error("Failed to disconnect:", response.data);
        }
      } catch (error) {
        console.error("Error disconnecting:", error);
      }
    } else {
      console.error("Link not selected");
    }
  };
  

  const handleRelease = async () => {
    if (selectedNode) {
      try {
        const payload = {
          duts: [
            {
              dut: selectedNode.id
            }
          ],
          links: dutLinks
        };
        
        const response = await Axios.post("release/", payload, {
          headers: {
            'Authorization': authHeader()
          }
        });
  
        if (response.status === 200) {
          console.log(response.data);
          fetchData();
        } else {
          console.error("Failed to release:", response.data);
        }
      } catch (error) {
        console.error("Error releasing:", error);
      }
    } else {
      console.error("Node not selected");
    }
  };
  

  useEffect(() => {
    const svg = d3.select("#dutMap").select("svg");
  
    const zoom = d3.zoom()
      .scaleExtent([0.5, 5]) // Define the minimum and maximum zoom scale
      .on("zoom", (event) => {
        svg.attr("transform", event.transform); // Apply the zoom and pan transformation
      });
  
    svg.call(zoom);
  
    return () => {
      svg.on(".zoom", null); // Cleanup the zoom event listener
    };
  }, []);
  

  const getImageForDut = (model) => {
    if (model.startsWith('OS6865')) {
      return "https://web-assets.al-enterprise.com/-/media/assets/internet/images/omniswitch-6865-u12x-left-480x480-product-showcase.png?h=480&w=480&v=1&d=20220704T122209Z&hash=3C426637869383F21046773B4B93EFD0";
    } else if (model.startsWith('OS6900')) {
      return "https://web-assets.al-enterprise.com/-/media/assets/internet/images/os6900-v48c8-t-l-480x480-v2.png?h=480&w=480&v=1&d=20220722T110520Z&hash=62DBF5606DBF860B88FEFA610AF34F81";
    } else if (model.startsWith('OS2260') || model.startsWith('OS2360')) {
        return "https://web-assets.al-enterprise.com/-/media/assets/internet/images/omniswitch-2260-10-product-image-r-480x480.png?h=480&w=480&v=1&d=20220630T143454Z&hash=0598E832835FC299600385AF68AC984D";
    } else if (model.startsWith('OS6360')) {
        return "https://web-assets.al-enterprise.com/-/media/assets/internet/images/omniswitch-6360-48-tf-480x480.png?h=480&w=480&v=1&d=20221020T155326Z&hash=C6668A49473E69A87CA7785CC7E43ABC";
    } else if (model.startsWith('OS6560')) {
        return "https://web-assets.al-enterprise.com/-/media/assets/internet/images/omniswitch-6560-p24z8-front-480x480-product-showcase.png?h=480&w=480&v=1&d=20220704T122130Z&hash=C25315F4EC064DDB834DE3E69C824099";
    } else if (model.startsWith('OS6465T')) {
        return "https://web-assets.al-enterprise.com/-/media/assets/internet/images/omniswitch-6465t-12-tf-480x480-product-showcase.png?h=480&w=480&v=1&d=20220704T122043Z&hash=D37F8E27FF45F2B1B560305425E61FC2";
    } else if (model.startsWith('OS6465')) {
        return "https://web-assets.al-enterprise.com/-/media/assets/internet/images/os6465-p6-photo-front-lft-4c-480-480-all-web.png?h=480&w=480&v=1&d=20220802T091822Z&hash=7265A78DB23E42E9886274D26C9C35AF";
    } else if (model.startsWith('OS6570M-12')) {
        return "https://web-assets.al-enterprise.com/-/media/assets/internet/images/omniswitch-6570m-12d-f-480x320.png?h=320&w=480&v=1&d=20221129T125730Z&hash=96BC4CEBBEA29011D977885F046F3DED";
    } else if (model.startsWith('OS6570M-U28')) {
        return "https://web-assets.al-enterprise.com/-/media/assets/internet/images/omniswitch-6570m-u28-f-480x480.png?h=480&w=480&v=1&d=20221129T125730Z&hash=E06FD7AC28031D2C82D00ABDD1B3FE6B";
    } else if (model.startsWith('OS6860')) {
        return "https://web-assets.al-enterprise.com/-/media/assets/internet/images/omniswitch-6860e-p48-left-4c-480x480-product-showcase.png?h=480&w=480&v=1&d=20220704T122032Z&hash=7A8A99DFFEB945EA9B4E35A7123E5426";
    } else if (model.startsWith('OS9900') || model.startsWith('OS9912')) {
        return "https://web-assets.al-enterprise.com/-/media/assets/internet/images/omniswitch-9907-photo-right-4c-480x480-web.png?h=480&w=480&v=1&d=20220802T091625Z&hash=9FD163873BA22C93391F497D4F0BFF59";
    } else {
      return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAANQAAAA2CAYAAAC/UreRAAAACXBIWXMAABcSAAAXEgFnn9JSAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAA91JREFUeNrsnb9v00AUx90QoFWpilSkLIh2ABaE6MhWL0yVIIiF0VlRJcLGgur/gFYqbChmYs0SiQ13YoOwILE1A0JsREKiiEK5V16QCflhfG6x489HOrlN4svl7r557y5396b29/edo2ZttbFkLm2T5h2ACGfPLzj3N68P6zdHXZyOSTsmhSY1t1q19rgbSv+j0kzBpJBVug9knEWTVkxaN+m1EXTbJC9zglJRieo3aTPIEVdMahhRheplZUdQim9Sl3aCnCFWS6yV2//E1LgxlJo4cc/cyJinG/ErA8vxlOTfoI0gg2OoONw0GmiOFZSqL1A/ctzArRpnwDZCVDsx3gcQVBaLLMbF7fX/0gir8SJmJ1/UAZtnUaiArgQ5ZT7af0tDLFOSrwIZrC0jKCjiZIXp+/4wC2XTuZtJbtJp9De0C+SY+l+CUrfNZiyzaOH6hbQJ5Nn1k77fb6G8FDKuIigoKNV+Qa2kkOmNhPd9oj0g57ilrJREV04A5NrtK1EHAOmBoAAOUVBpTF0z/Q0ISmmmkGeQ5Ka11cZpmgMmTVAbjt3q766T/IfhZZoDJkpQW62aTF3XLfKrax4IChCUikoszNMEeW1abuVAUDB5glJReeZyL6b7J6+pmXvqlmVxaQ6YSEGpqDbUasg29c6Al3T0uaUUNhnK+7AfCnJPedSTugpcLE9dZ+F6blnbYqw0cOxFU8DEC6pPXCKgMO0CqFA5AQkm2+U7QsQ6cT4fIKgUrNMS7h4gqPQIsE6AoNKxTmKZVmgCQFD2YnLN5SHVDwjKXkwy9d6k6gFBpSOmkHETICh7MXmICSadskQSMFdPV0UchpDkh9vASX54C0CuLFQvkoCf9iY/tUo7iAkKY6H0Km6YBJWSNXuyKDZIarEiS4l8hwWvUFBBOX3CWjfC2HZ+zcaF4yJr6GSDqwlrBIVl6tmjl7GC7E7PHP9YKh/bjT72Y+/79O6Xb5U8fvCZ2ZPOuQtn6AEZY3buhHPxcmXYF3f2LdTtO1fjvrZCcwOMn5QAAAQFgKAAEBQAxKP89tWHz193904V8cO/a7+nB2SMhcqcc+3WpbwWv1t+/OD5E/PHXZoSsoBEgc+xoEJx+UKaESAVmqWtVk1WQ3SoCwA7d+9AUPqPT30AWLEhR+0dCEpPft2mTgASIR6eLCr/Y9rcc+xC2QAUlWrvJOXfgtLtGi6iAvgnatHdGP3xodqICiAWvagzQfTBQfGhRFTLjKkAhiJxpN1BUWcGBgvouX+6hd132HkLIMjkgz8qfNO4cDZyY6A7cj21XJz2CkVCPDXx2kL9zXYkPwUYAG4LHegAiftIAAAAAElFTkSuQmCC";
    }
  }

  useEffect(() => {
    if (duts.length > 0 && Object.keys(dutLinks).length > 0) {
      const width = window.innerWidth * 0.9;
      const height = window.innerHeight * 0.9; 
      const svg = d3.select("#dutMap")
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .style("filter", "drop-shadow(0px 4px 10px rgba(0, 0, 0, 0.15))");
        

      svg.append("rect")
        .attr("width", width)
        .attr("height", height)
        .style("rx", "20")
        .style("ry", "20")
        .style("fill", "#FFFFFF");

        svg.on("mousedown", (event) => {
          if (!event.target.classList.contains("selectable-rect")) {
            if (connectMode) {
              setSelectedNodeA(null);
              setSelectedNodeB(null);
            } else {
              setSelectedNode(null);
            }
            setShowNodeSlideOver(false);
            setSelectedLink(false);
            setConnectMode(false);
          }
        });
        
        

        const radius = Math.min(width, height) * 0.3;
        duts.forEach((d, i, nodeGroups) => {
          d.x = width / 2 + radius * Math.cos(2 * Math.PI * i / nodeGroups.length);
          d.y = height / 2 + radius * Math.sin(2 * Math.PI * i / nodeGroups.length);
        });
        
        duts.forEach(d => {
          if (d.positionX != null && d.positionY != null) {
            d.x = (d.positionX / 100) * width;
            d.y = (d.positionY / 100) * height;
          }
        });

      const linkData = Object.values(dutLinks).flat().map(link => {
        return {
          source: duts.find(d => d.id === link.source),
          target: duts.find(d => d.id === link.target),
          ID: link.id,
          targetID: link.targetID,
          source_port: link.source_port,
          target_port: link.target_port
        };
      });

      const getSimilarLinks = (linkData) => {
        const seen = new Map();
        const similar = {};
    
        linkData.forEach(link => {
            const identifier = `${link.source.id}-${link.target.id}`;
            const identifier2 = `${link.target.id}-${link.source.id}`;
    
            if (seen.has(identifier)) {
                if (!similar[identifier]) {
                    similar[identifier] = [seen.get(identifier)];
                }
                if (!similar[identifier].includes(link)) {
                    similar[identifier].push(link);
                }
            } else if (seen.has(identifier2)) {
                if (!similar[identifier2]) {
                    similar[identifier2] = [seen.get(identifier2)];
                }
                if (!similar[identifier2].includes(link)) {
                    similar[identifier2].push(link);
                }
            } else {
                seen.set(identifier, link);
            }
        });
    
        return similar;
    };
    
    setSimilarLinks(getSimilarLinks(linkData));    
    
    

      const clickableLinks = svg.append("g")
      .selectAll("line.clickable-link")
      .data(linkData)
      .enter().append("line")
      .attr("class", "clickable-link")
      .attr("stroke", "transparent")
      .attr("x1", d => d.source.x)
      .attr("y1", d => d.source.y)
      .attr("x2", d => d.target.x)
      .attr("y2", d => d.target.y)
      .attr("stroke-width", 20)
      .on("mouseover", function() {
        d3.select(this).attr("stroke", "#d699ff");
      })
      .on("mouseout", function() {
        d3.select(this).attr("stroke", "transparent");
      })
      .on("click", (event, d) => {
        setSelectedLink(d);
      });


      // Create links
      const links = svg.append("g")
        .selectAll("line")
        .data(linkData)
        .enter().append("line")
        .attr("class", "link")
        .attr("stroke", "black")
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y)
        .attr("stroke", d => selectedLink && (d.source === selectedLink.source && d.target === selectedLink.target) ? "purple" : "black")
        .attr("stroke-width", d => selectedLink && (d.source === selectedLink.source && d.target === selectedLink.target) ? 5 : 1)
          
      // Create node groups
      const nodeGroups = svg.append("g")
      .selectAll("g.node-group")
      .data(duts)
      .enter().append("g")
      .attr("class", "node-group")
      .attr("transform", d => `translate(${Math.max(60, Math.min(width - 60, d.x)) - 60}, ${Math.max(60, Math.min(height - 60, d.y)) - 60})`)
      .on("click", (event, d) => {
        if (connectModeRef.current) {
          setSelectedNodeA(prevSelectedConnectA => {
            if (!prevSelectedConnectA) {
              return d;
            } else if (!selectedConnectB && prevSelectedConnectA !== d) {
              setSelectedNodeB(d);
              return prevSelectedConnectA;
            } else {
              setSelectedNodeB(null);
              return d;
            }
          });
        } else {
          setSelectedNode(d);
          setShowNodeSlideOver(true);
        }
      })          
      .call(d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));

      nodeGroups.append("rect")
      .attr("width", 120)
      .attr("height", 120)
      .attr("stroke-width", d => selectedNode === d ? "3" : "0")
      .attr("stroke", d => selectedNode === d ? "purple" : "none")
      .attr("stroke-dasharray", "5,5")
      .attr("fill", "transparent")
      .attr("class", "selectable-rect");

      nodeGroups.append("image")
      .attr("xlink:href", d => getImageForDut(d.model))
      .attr("width", 120)
      .attr("height", 120);
  
      function dragstarted(event, d) {
        d3.select(this).raise();
      }
      
      function dragged(event, d) {
        d.x = Math.max(0, Math.min(width - 20, event.x));
        d.y = Math.max(0, Math.min(height - 20, event.y));
        d3.select(this).attr("transform", `translate(${d.x - 60}, ${d.y - 60})`);
        // Update the links connected to this node
        links.each(function(l) {
          if (l.source === d) {
            d3.select(this).attr("x1", d.x).attr("y1", d.y);
          } else if (l.target === d) {
            d3.select(this).attr("x2", d.x).attr("y2", d.y);
          }
        });

        clickableLinks.each(function(l) {
          if (l.source === d) {
              d3.select(this).attr("x1", d.x).attr("y1", d.y);
          } else if (l.target === d) {
              d3.select(this).attr("x2", d.x).attr("y2", d.y);
          }
      });
      }
      
      function dragended(event, d) {
        const relativeX = (d.x / width) * 100;
        const relativeY = (d.y / height) * 100;
      
        Axios.post(`update_dut_position/?dut=${d.id}`, {
          positionX: relativeX,
          positionY: relativeY
        }, {
          headers: {
            'Authorization': authHeader()
          }
        }).then(response => {
          console.log("Position updated successfully");
        }).catch(error => {
          console.error("Error updating position:", error);
        });
      }

  
      // Cleanup on component unmount
      return () => {
        svg.remove();
      };
    }
  }, [duts, dutLinks]);
  

  if (!reservation) {
    return <div>Loading...</div>;
  }

  const reservationEndDate = new Date(reservation.end);
  if (reservationEndDate < new Date()) {
    return (
      <main className="bg-purple px-6 pt-16 pb-24 lg:px-8 relative">
        <Header />
        <div className="text-center my-40">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">This reservation has expired</h2>
          <button 
            className="bg-white text-purple-600 border-2 border-purple-600 py-2 px-8 rounded-md shadow-md hover:bg-gray-200 hover:border-purple-700 hover:text-purple-700 transition-colors duration-200"
            onClick={() => redirect('/reservation')}
          >
            View Reservations
          </button>
        </div>
      </main>
    );
  }

  if (duts.length === 0) {
    return (
      <main className="bg-purple px-6 pt-16 pb-24 lg:px-8 relative">
        <Header />
      <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80" aria-hidden="true">
        <div
          className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
          style={{
            clipPath:
              "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
          }}
        />
      </div>
        <div className="text-center my-40">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">This reservation has no devices</h2>
          <button 
            className="bg-white text-purple-600 border-2 border-purple-600 py-2 px-8 rounded-md shadow-md hover:bg-gray-200 hover:border-purple-700 hover:text-purple-700 transition-colors duration-200"
            onClick={() => redirect('/equipment')}
          >
            Add Equipment
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-purple px-6 pt-16 pb-24 lg:px-8 relative">
      <Header />
      <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80" aria-hidden="true">
        <div
          className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
          style={{
            clipPath:
              "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
          }}
        />
      </div>
      <div className="mx-auto max-w-6xl py-10 sm:py-14 lg:py-18 z-10 relative">
      <div className="flex min-h-[60vh] flex-1 flex-col justify-center items-center">
        <div className="w-full flex justify-center items-center mb-2">
          <button 
            className="bg-white text-purple-600 border-2 border-purple-600 p-2 rounded-md shadow-md hover:bg-gray-200 hover:border-purple-700 hover:text-purple-700 transition-colors duration-200 mr-4"
            onClick={() => redirect('/equipment')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
          </button>
          <div className="bg-white shadow-md rounded-md px-6 py-2">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              {reservation.name}
            </h1>
          </div>
          <button 
            className="bg-white text-purple-600 border-2 border-purple-600 p-2 rounded-md shadow-md hover:bg-gray-200 hover:border-purple-700 hover:text-purple-700 transition-colors duration-200 ml-4"
            onClick={() => {
              setConnectMode(true);
              setShowNodeSlideOver(false);
              setSelectedLink(false);
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
              </svg>
          </button>
        </div>

        <div id="dutMap"></div>
      </div>
    </div>
      {showNodeSlideOver && (
      <div className="relative z-10" aria-labelledby="slide-over-title" role="dialog" aria-modal="true">
        <div className="overflow-hidden">
        <div className="absolute inset-0 overflow-hidden" style={{ height: `${canvasHeight}px` }}>
            <div className="pointer-events-none fixed inset-y-0 left-0 top-20 bottom-20 flex max-w-full">
            <div className="pointer-events-auto relative" style={{ width: `${panelWidth}px` }}>
                <div className="flex h-full flex-col bg-white py-6 shadow-xl">
                <div className="px-4 sm:px-6">
                <h3 className="text-xl font-bold mb-4">Node Information</h3>
                <div className="relative mt-6 flex-1 px-4 sm:px-6"></div>
              </div>
                  <div className="px-4 sm:px-6">
                    <h2 className="text-base font-semibold leading-6 text-gray-900" id="slide-over-title">{selectedNode.id}</h2>
                    <p>{selectedNode.model}</p>
                    <p>{selectedNode.console}</p>
                    <p>{selectedNode.ip_mgmt}</p>
                    <br />
                    <button 
                        className="mt-4 bg-white text-purple-600 border-2 border-purple-600 py-2 px-4  rounded-md shadow-md hover:bg-gray-200 hover:border-purple-700 hover:text-purple-700 transition-colors duration-200 flex items-center justify-center" 
                        onClick={() => {
                          handleRelease();
                          setShowNodeSlideOver(false);
                        }}
                    >
                        Release device
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )}
    {connectMode && (
      <div className="relative z-10" aria-labelledby="slide-over-title" role="dialog" aria-modal="true">
        <div className="overflow-hidden">
          <div className="absolute inset-0 overflow-hidden" style={{ height: `${canvasHeight}px` }}>
            <div className="pointer-events-none fixed inset-y-0 right-0 top-20 bottom-20 flex max-w-full">
              <div className="pointer-events-auto relative" style={{ width: `${panelWidth}px` }}>
                <div className="flex h-full flex-col bg-white py-6 shadow-xl">
                  <div className="px-4 sm:px-6">
                    <h3 className="text-xl font-bold mb-4">Connect Mode</h3>
                  </div>
                  <div className="relative mt-6 flex-1 px-4 sm:px-6 overflow-y-auto" style={{ maxHeight: 'calc(100% - 100px)' }}>
                    {!selectedConnectA && !selectedConnectB && (
                      <p>Select two nodes from the map.</p>
                    )}
                    {selectedConnectA && (
                      <>
                        <div className="mb-4">
                          <strong>DUT Model A:</strong> {selectedConnectA.model}
                        </div>
                        <div className="mt-4">
                          Select port for Model A.
                        </div>
                        {availablePorts[selectedConnectA?.id]?.map(port => (
                          <div key={port} className="flex items-center break-words">
                            <div 
                              className={`mr-2 w-4 h-4 rounded-full cursor-pointer hover:bg-gray-400 ${port === selectedPortA ? 'bg-blue-500' : 'bg-gray-300'}`} 
                              onClick={() => setSelectedPortA(port)}
                            ></div>
                            {port.source_port}
                          </div>
                        ))}
                      </>
                    )}
                    {selectedConnectB && (
                      <>
                        <div className="mb-4">
                          <strong>DUT Model B:</strong> {selectedConnectB.model}
                        </div>
                        <div className="mt-4">
                          Select port for Model B.
                        </div>
                        {availablePorts[selectedConnectB?.id]?.map(port => (
                          <div key={port} className="flex items-center">
                            <div 
                              className={`mr-2 w-4 h-4 rounded-full cursor-pointer hover:bg-gray-400 ${port === selectedPortB ? 'bg-blue-500' : 'bg-gray-300'}`} 
                              onClick={() => setSelectedPortB(port)}
                            ></div>
                            {port.source_port}
                          </div>
                        ))}
                      </>
                    )}
                    {selectedConnectA && !selectedConnectB && (
                      <div className="mt-4">
                        Select another device on the map.
                      </div>
                    )}
                    {selectedConnectA && selectedConnectB && (
                      <button 
                        className="mt-4 bg-green-200 text-white py-2 px-4 shadow-md hover:bg-green-300 active:bg-green-400" 
                        onClick={handleConnect}
                      >
                        Connect
                      </button>
                    )}
                    <button 
                      className="mt-4 bg-red-200 text-white py-2 px-4 shadow-md hover:bg-red-300 active:bg-red-400" 
                      onClick={() => {
                        setConnectMode(false);
                        setSelectedNodeA(null);
                        setSelectedNodeB(null);
                        setSelectedNode(null);
                      }}
                    >
                      Exit Connect Mode
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )}
  {selectedLink && (
  <div className="relative z-10" aria-labelledby="slide-over-title" role="dialog" aria-modal="true">
  <div className="overflow-hidden">
    <div className="absolute inset-0 overflow-hidden" style={{ height: `${canvasHeight}px` }}>
      <div className="pointer-events-none fixed inset-y-0 left-0 top-20 bottom-20 flex max-w-full">
        <div className="pointer-events-auto relative" style={{ width: `${panelWidth}px` }}>
          <div className="flex h-full flex-col bg-white py-6 shadow-xl">
              <div className="px-4 sm:px-6">
                <h3 className="text-xl font-bold mb-4">Link Information</h3>
              </div>
              <div className="relative mt-6 flex-1 px-4 sm:px-6">

              {(() => {
                const identifier = `${selectedLink.source.id}-${selectedLink.target.id}`;
                const identifier2 = `${selectedLink.target.id}-${selectedLink.source.id}`;
                const links = similarLinks[identifier] || similarLinks[identifier2];
                if (links && links.length > 1) {
                    // Create a set to keep track of added links
                    const addedLinksSet = new Set();
                
                    // Filter the links to exclude the reverse ones
                    const filteredLinks = links.filter(link => {
                        const linkKey = `${link.source_port}-${link.target_port}`;
                        const reverseLinkKey = `${link.target_port}-${link.source_port}`;
                
                        if (!addedLinksSet.has(reverseLinkKey)) {
                            addedLinksSet.add(linkKey);
                            return true;
                        }
                        return false;
                    });
                
                    return (
                        <select 
                            value={selectedDropdownLink}
                            onChange={(e) => {
                                const selectedID = e.target.value;
                                const newSelectedLink = filteredLinks.find(link => link.ID === Number(selectedID));
                                setSelectedLink(newSelectedLink);
                            }}
                        >
                            {/* Default option */}
                            <option value="" disabled selected>Select Link</option>
                            
                            {filteredLinks.map(link => (
                                <option key={link.ID} value={link.ID}>
                                    Link {link.source_port} - {link.target_port}
                                </option>
                            ))}
                        </select>
                    );
                }
            })()}

              <br />
              <br />
              <strong>Source DUT:</strong> {selectedLink.source.model}
              <p>Port: {selectedLink.source_port}</p>
              <br />
              <strong>Target DUT:</strong> {selectedLink.target.model}
              <p>Port: {selectedLink.target_port}</p>
              <div className="flex flex-col">
                  <button 
                    className="mb-2 bg-red-200 text-white py-2 px-4 shadow-md hover:bg-red-300 active:bg-red-400" 
                    onClick={handleDisconnect}
                  >
                    Disconnect
                  </button>
                  <button 
                    className="bg-gray-200 text-black py-2 px-4 shadow-md hover:bg-gray-300 active:bg-gray-400" 
                    onClick={() => setSelectedLink(null)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
)}
  </main>
);
}