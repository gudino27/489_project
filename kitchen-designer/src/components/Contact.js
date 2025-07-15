import React, { useState } from 'react';
import Navigation from './Navigation';
import './css/contact.css';

const Contact = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  });

  const [selectedServices, setSelectedServices] = useState({
    kitchen: false,
    bathroom: false,
    other: false
  });

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    // For phone number, only allow digits and limit to 10
    if (id === 'phone') {
      const digits = value.replace(/\D/g, '').slice(0, 10);
      setFormData(prev => ({ ...prev, [id]: digits }));
    } else {
      setFormData(prev => ({ ...prev, [id]: value }));
    }
  };

  const handleCheckboxChange = (service) => {
    setSelectedServices(prev => ({
      ...prev,
      [service]: !prev[service]
    }));
  };

  const makeContact = () => {
    const { firstName, lastName, email, phone } = formData;
    
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !phone.trim()) {
      alert("Fill in all fields to submit.");
      return;
    }
    
    if (!email.includes("@")) {
      alert("Invalid email address.");
      return;
    }

    // Clear form
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: ''
    });
    setSelectedServices({
      kitchen: false,
      bathroom: false,
      other: false
    });

    alert("Thank you, we will be in touch!");
  };

  return (
    <>
      <Navigation />

      <div className="banner">
        Contact Master Build Cabinets
      </div>

      <div className="introduction">
        If you have any questions related to estimates or services please fill
        out the contact form below. A team member will get back to you as soon
        as possible.
      </div>

      <div className="description">
        Please fill out all fields.
      </div>

      <div className="form">
        <input 
          type="text" 
          id="firstName" 
          placeholder="First name"
          value={formData.firstName}
          onChange={handleInputChange}
        />
      </div>

      <div className="form">
        <input 
          type="text" 
          id="lastName" 
          placeholder="Last name"
          value={formData.lastName}
          onChange={handleInputChange}
        />
      </div> 

      <div className="form">
        <input 
          type="text" 
          id="email" 
          placeholder="Email"
          value={formData.email}
          onChange={handleInputChange}
        />
      </div>

      <div className="form">
        <input 
          type="tel" 
          id="phone" 
          placeholder="Phone number" 
          inputMode="numeric" 
          pattern="\d{10}" 
          maxLength="10"
          value={formData.phone}
          onChange={handleInputChange}
        />
      </div>

      <div className="description">
        What can we help you with?
      </div>

      <div className="check">
        <label>
          <input 
            type="checkbox" 
            value="kitchen"
            checked={selectedServices.kitchen}
            onChange={() => handleCheckboxChange('kitchen')}
          />
          <span>Kitchen</span>
        </label>
        <label>
          <input 
            type="checkbox" 
            value="bathroom"
            checked={selectedServices.bathroom}
            onChange={() => handleCheckboxChange('bathroom')}
          />
          <span>Bathroom</span>
        </label>
        <label>
          <input 
            type="checkbox" 
            value="other"
            checked={selectedServices.other}
            onChange={() => handleCheckboxChange('other')}
          />
          <span>Other</span>
        </label>
      </div>
      
      <div className="description">
        Make sure all information is correct before submitting.
      </div>

      <button type="submit" onClick={makeContact}>Submit</button>
    </>
  );
};

export default Contact;