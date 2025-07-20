import React, { useState } from 'react';
import Navigation from './Navigation';
import './css/contact.css';
import jsPDF from 'jspdf';

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

  const generatePDF = () => {
    const doc = new jsPDF();
    const { firstName, lastName, email, phone } = formData;
    const selected = Object.entries(selectedServices)
      .filter(([_, v]) => v)
      .map(([k]) => k)
      .join(", ") || "None";

    const dateSubmitted = new Date().toLocaleString();
    doc.setFontSize(16);
    doc.text("Contact Submission", 20, 20);
    doc.text("Please email this to contact@masterbuildcabinets.com", 20, 30);
    doc.setFontSize(12);
    doc.text(`First Name: ${firstName}`, 20, 50);
    doc.text(`Last Name: ${lastName}`, 20, 60);
    doc.text(`Email: ${email}`, 20, 70);
    doc.text(`Phone: ${phone}`, 20, 80);
    doc.text(`Services Requested: ${selected}`, 20, 90);
    doc.text(`Date Requested: ${dateSubmitted}`, 20, 100);

    doc.save("contact-form.pdf");
  };

  const makeContact = () => {
    const { firstName, lastName, email, phone } = formData;
    const isAnyServiceSelected = Object.values(selectedServices).some(value => value === true);
    
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !phone.trim()) {
      alert("Fill in all fields to submit.");
      return;
    }

    if (firstName.trim().length < 2 || lastName.trim().length < 2) {
    alert("First and last names must be at least 2 characters long.");
    return;
    }

    if (phone.replace(/\D/g, '').length !== 10){
      alert("Please enter a 10 digit phone number.")
      return;
    }
    
    if (!email.includes("@")) {
      alert("Invalid email address. Please include an '@' symbol.");
      return;
    }

    if (!isAnyServiceSelected) {
      alert("Please select at least one service we can help you with.");
      return;
    }

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

    alert("Submission successful! Generating contact form.");
    generatePDF();
  };

  return (
    <>
      <Navigation />

      <div className="contact-container">
        <div className="contact-banner">
          Contact Master Build Cabinets
        </div>
      </div>

      <div className="contact-introduction">
        If you have any questions related to estimates or services please fill
        out the contact form below and email the resulting form to contact@masterbuildcabinets.com
      </div>

      <div className="instruction">
        Please fill out all fields.
      </div>

      <div className="form">
        <input 
          type="text" 
          id="firstName" 
          maxLength="100"
          placeholder="First name"
          value={formData.firstName}
          onChange={handleInputChange}
        />
      </div>

      <div className="form">
        <input 
          type="text" 
          id="lastName" 
          maxLength="100"
          placeholder="Last name"
          value={formData.lastName}
          onChange={handleInputChange}
        />
      </div> 

      <div className="form">
        <input 
          type="text" 
          id="email"
          maxLength="100"
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

      <div className="instruction">
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
      
      <div className="instruction">
        Make sure all information is correct before submitting.
      </div>

      <button type="submit" onClick={makeContact}>Submit</button>
    </>
  );
};

export default Contact;