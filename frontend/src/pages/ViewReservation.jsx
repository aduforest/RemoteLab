import React, { useState, useEffect, useRef } from 'react';
import { Header } from "../components";
import Axios from "../Axios";
import { useAuthHeader } from 'react-auth-kit';
import { useParams } from 'react-router-dom';
import * as d3 from 'd3';

export default function ViewReservation() {
  const [reservation, setReservation] = useState(null);
  const [duts, setDuts] = useState([]);
  const authHeader = useAuthHeader();
  const { id } = useParams();
  const [dutLinks, setDutLinks] = useState({});
  const [showDropdown, setShowDropdown] = useState(null);
  const dropdownRef = useRef(null);
  const [selectedNodes, setSelectedNodes] = useState([]);
  const [showPopup, setShowPopup] = useState(false);

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

  const toggleDropdown = (dutId) => {
    if (showDropdown === dutId) {
      setShowDropdown(null);
    } else {
      setShowDropdown(dutId);
    }
  };

  
  useEffect(() => {
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
        const fetchedDuts = dutsResponse.data.duts;
        setDuts(fetchedDuts);
  
        const linkResponses = await Promise.all(fetchedDuts.map(dut => 
          Axios.get(`list_link/?dut=${dut.id}`, {
            headers: {
              'Authorization': authHeader()
            }
          })
        ));
  
        const links = {};
        linkResponses.forEach((response, index) => {
          links[fetchedDuts[index].id] = response.data.connected;
        });
        setDutLinks(links);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
  
    fetchData();
    
  }, [id]);
  
  const handleNodeClick = (d) => {
    let updatedNodes;
    if (selectedNodes.includes(d)) {
      updatedNodes = selectedNodes.filter(node => node !== d);
    } else {
      updatedNodes = [...selectedNodes, d];
    }
    setSelectedNodes(updatedNodes);
    if (updatedNodes.length === 2) {
      setShowPopup(true);
    }
  };
  


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
      // Set up SVG canvas dimensions
      const width = window.innerWidth * 0.8;
      const height = window.innerHeight; 
      // Create an SVG element
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
        

      const radius = Math.min(width, height) * 0.3;
      duts.forEach((d, i, nodes) => {
        d.x = width / 2 + radius * Math.cos(2 * Math.PI * i / nodes.length);
        d.y = height / 2 + radius * Math.sin(2 * Math.PI * i / nodes.length);
      });

      const linkData = Object.values(dutLinks).flat().map(link => {
        return {
          source: duts.find(d => d.id === link.source),
          target: duts.find(d => d.id === link.target)
        };
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
        .attr("y2", d => d.target.y);
  
      // Create nodes (DUTs)
      const nodes = svg.append("g")
        .selectAll("image")
        .data(duts)
        .enter().append("image")
        .attr("xlink:href", d => getImageForDut(d.model))
        .attr("width", 120)
        .attr("height", 120)
        .style("border", d => selectedNodes.includes(d) ? "2px solid blue" : "none")
        .style("fill", d => selectedNodes.includes(d) ? "purple" : "none")
        .on("click", handleNodeClick)
        .attr("x", d => Math.max(60, Math.min(width - 60, d.x)) - 60)
        .attr("y", d => Math.max(60, Math.min(height - 60, d.y)) - 60)
        .call(d3.drag()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended));

      
  
      function dragstarted(event, d) {
        d3.select(this).raise().classed("active", true);
      }
      
      function dragged(event, d) {
        d.x = event.x;
        d.y = event.y;
        d3.select(this).attr("x", d.x - 60).attr("y", d.y - 60);
        // Update the links connected to this node
        links.each(function(l) {
          if (l.source === d) {
            d3.select(this).attr("x1", d.x).attr("y1", d.y);
          } else if (l.target === d) {
            d3.select(this).attr("x2", d.x).attr("y2", d.y);
          }
        });
      }
      
      function dragended(event, d) {
        d3.select(this).classed("active", false);
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

  return (
    <main className="bg-purple px-6 pt-16 pb-24 lg:px-8 relative">
      <Header />
      {/* Purple tint */}
      <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80" aria-hidden="true">
        <div
          className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
          style={{
            clipPath:
              "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
          }}
        />
      </div>
      {/* End of Purple tint */}
      <div className="mx-auto max-w-6xl py-10 sm:py-14 lg:py-18 z-10 relative">
      <div className="text-center mb-2">
        {/* Tab styled div for reservation name */}
        <div className="bg-white shadow-md rounded-md px-6 py-2 inline-block">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            {reservation.name}
          </h1>
        </div>
      </div>
      <div className="flex min-h-[60vh] flex-1 flex-col justify-center items-center">
      <div className="flex justify-between w-full mb-4">
      <button className="btn btn-primary">
        Connect
      </button>
        <button className="btn btn-secondary">Add Equipment</button>
      </div>
      <div id="dutMap"></div>
      {showPopup && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-4 rounded shadow-lg">
          <h2>Ports</h2>
          <p>{selectedNodes[0]?.id}</p>
          <p>{selectedNodes[1]?.id}</p>
        </div>
      )}
    </div>
    </div>
  </main>
);
}