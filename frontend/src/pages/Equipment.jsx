import React, { useState, useEffect } from 'react';
import Axios from '../Axios';
import { useAuthHeader } from 'react-auth-kit';
import { Header } from "../components";
import { useNavigate } from 'react-router-dom';


export default function Equipment() {
  const [duts, setDuts] = useState([]);
  const [selectedDuts, setSelectedDuts] = useState([]);
  const authHeader = useAuthHeader();
  const [showModal, setShowModal] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [reservations, setReservations] = useState([]);
  const [filterModels, setFilterModels] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const redirect = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);



  useEffect(() => {
    const fetchAvailableDUTs = async () => {
      try {
        const response = await Axios.get('list_dut/available/', {
          headers: {
            'Authorization': authHeader()
          }
        });
        setDuts(response.data);
      } catch (error) {
        console.error('Error fetching available DUTs:', error);
      }
    };

    fetchAvailableDUTs();

    const fetchUserReservations = async () => {
      try {
        const response = await Axios.get('list_reservation/', { // Assuming this is the correct endpoint
          headers: {
            'Authorization': authHeader()
          }
        });
        setReservations(response.data.reservation);
      } catch (error) {
        console.error('Error fetching user reservations:', error);
      }
    };

    fetchAvailableDUTs();
    fetchUserReservations();
  }, []);

  const toggleDropdown = () => {
    setShowDropdown(prevShow => !prevShow);
  };
  

  const handleSelect = (dutId) => {
    if (selectedDuts.includes(dutId)) {
      setSelectedDuts(prevState => prevState.filter(id => id !== dutId));
    } else {
      setSelectedDuts(prevState => [...prevState, dutId]);
    }
  }

  const handleReserve = async () => {
    const payload = {
      reservations: selectedDuts.map(dutId => ({
        reservation: selectedReservation,
        dut: dutId
      }))
    };

    try {
      const response = await Axios.post('reserve/', payload, {
        headers: {
          'Authorization': authHeader()
        }
      });
      console.log('Reservation successful:', response.data);
      closeModal();
    } catch (error) {
      console.error('Error reserving DUTs:', error);
    }
  }

  const handleAddToReservation = () => {
    if (reservations.length > 0) {
      setSelectedReservation(reservations[0].id);
    }
    setShowModal(true);
  }
  
  const handleModelChange = (model) => {
    setFilterModels(prev => {
      const newFilter = new Set(prev);
      if (newFilter.has(model)) {
        newFilter.delete(model);
      } else {
        newFilter.add(model);
      }
      return newFilter;
    });
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const knownModels = new Set([
    'OS2260', 'OS2360', 'OS6360', 'OS6465', 'OS6465T', 'OS6560', 'OS6570M-12', 'OS6570M-U28', 'OS6860', 'OS6900', 'OS9900', 'OS9912'
  ]);
  
  const filteredDuts = duts.filter(dut => {
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    const isModelSelected = [...filterModels].some(selectedModel => 
      dut.model.toLowerCase().includes(selectedModel.toLowerCase())
    );
    const isOtherSelected = filterModels.has('Other') && ![...knownModels].some(knownModel => 
      dut.model.toLowerCase().includes(knownModel.toLowerCase())
    );
    const matchesModel = filterModels.size === 0 || isModelSelected || isOtherSelected;
    const matchesSearch = lowerCaseSearchTerm === '' || 
      dut.id.toString().toLowerCase().includes(lowerCaseSearchTerm) || 
      dut.model.toLowerCase().includes(lowerCaseSearchTerm);
    return matchesModel && matchesSearch;
  });
  
  

  const closeModal = () => {
    setShowModal(false);
  }

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
    } else if (model.startsWith('Ixia') || model.startsWith('VM')) {
        return "https://cdn.pressebox.de/a/42c853cb3cbd3ed0/attachments/0666997.attachment/filename/PerfectStormONE-10G_870-0123_R20.jpg";
      } else {
      return "https://i.postimg.cc/hPj6CpYh/combine-images-2-removebg-preview.png";
    }
  }

  return (
    <main className="bg-purple px-6 pt-16 pb-24 lg:px-8 relative">
      <Header />
      <button 
        className="bg-white text-purple-600 border-2 border-purple-600 py-2 px-6 min-w-[200px] rounded-md shadow-md hover:border-purple-700 hover:text-purple-700 transition-colors duration-200 flex items-center justify-center absolute top-20 right-6 z-50" 
        onClick={handleAddToReservation}
    >
        Add to a Reservation
    </button>

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
      {/* Search by DUT ID */}
      <div className="p-4">
        <input
          type="text"
          placeholder="Search by DUT Model or ID"
          value={searchTerm}
          onChange={handleSearchChange}
          className="w-full rounded border-gray-300 focus:border-purple-500 focus:ring-purple-500"
        />
      </div>
      
      {/* Model Filter */}
      <div className="flex flex-col items-start justify-center p-2">
        <button id="dropdownDefault" data-dropdown-toggle="dropdown"
          className="text-black bg-primary-700 hover:bg-primary-800 focus:ring-4 focus:outline-none focus:ring-primary-300 font-medium rounded-lg text-sm px-4 py-2.5 text-center inline-flex items-center"
          onClick={toggleDropdown}
          type="button">
          Filter by model
          <svg className="w-4 h-4 ml-2" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
          </svg>
        </button>

        {/* Iterate over models to create checkboxes */}
        {['OS2260', 'OS2360', 'OS6360', 'OS6465', 'OS6465T', 'OS6560', 'OS6570M-12', 'OS6570M-U28', 'OS6860', 'OS6900', 'OS9900', 'OS9912', 'Other'].map(model => (
          <div key={model} className="flex items-center">
            <input 
              id={model}
              type="checkbox"
              value={model}
              checked={filterModels.has(model)}
              onChange={() => handleModelChange(model)}
              className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
            />
            <label htmlFor={model} className="ml-2 text-sm font-medium text-gray-900">
              {model}
            </label>
          </div>
        ))}
      </div>
    </div>

    <div className="bg-white">
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24 lg:max-w-7xl lg:px-8">
        <h2 className="sr-only">Available DUTs</h2>
        <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xl:gap-x-8">
          {filteredDuts.map(dut => (
            <div key={dut.id} className="group" onClick={() => handleSelect(dut.id)}>
              <div className="aspect-h-1 aspect-w-1 w-full overflow-hidden rounded-lg bg-gray-100 xl:aspect-h-8 xl:aspect-w-7">
                <img src={getImageForDut(dut.model)} alt={`Model ${dut.model}`} className="h-full w-full object-cover object-center group-hover:opacity-75" />
              </div>
              <div className="text-section h-24">
                <p className="mt-8 text-lg font-medium text-gray-900 truncate">{dut.model}</p>
                <h3 className="mt-1 text-sm text-gray-700 truncate">ID: {dut.id}</h3>
              </div>
              <button 
                className="mt-2 bg-purple-200 text-white py-1 px-3 rounded-full shadow-md hover:bg-purple-300 active:bg-purple-400" 
                onClick={(e) => { e.stopPropagation(); handleSelect(dut.id); }}
              >
                {selectedDuts.includes(dut.id) ? '✓ Selected' : 'Select'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
    {showModal && (
      <div className="fixed inset-0 flex items-center justify-center z-50">
        <div className="fixed inset-0 bg-black opacity-50" onClick={closeModal}></div>
        <div className="bg-white p-6 w-1/4 rounded-lg shadow-lg relative">
          <button className="absolute top-2 right-2 text-gray-500 hover:text-gray-700" onClick={closeModal}>
            &times;
          </button>
          <h3 className="text-xl font-bold mb-4">Selected Items</h3>
          <ul>
            {selectedDuts.map(id => (
              <li key={id}>ID: {id}</li>
            ))}
          </ul>
          <label className="block mt-4">
            <span className="text-gray-700">Select Reservation:</span>
            <select 
            className="form-select mt-1 block w-full"
            value={selectedReservation}
            onChange={e => setSelectedReservation(e.target.value)}
          >
            {reservations.map(reservation => (
              <option key={reservation.id} value={reservation.id}>
                {reservation.name}
              </option>
            ))}
          </select>
          </label>
          <button className="mt-4 bg-purple-500 text-white py-2 px-4 rounded" onClick={async () => {
            await handleReserve();
            redirect(`/viewreservation/${selectedReservation}`);
          }}>Add</button>
        </div>
      </div>
    )}
  </main>
);
}
