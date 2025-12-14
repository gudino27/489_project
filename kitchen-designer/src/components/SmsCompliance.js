import React, { useState, useEffect } from "react";
import "./css/sms-compliance.css";
import WebsitePrivacy from "./WebsitePrivacy";
import Navigation from "./ui/Navigation";
import CabinetCareContent from "./CabinetCare";
import Collapsible from "./ui/Collapsible";
const SmsCompliance = ({ defaultTab = "consent" }) => {
  const [activeTab, setActiveTab] = useState(defaultTab);

  useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab]);

  const ConsentContent = () => (
    <>
      <h1 className="sms-header">SMS Consent Verification Process</h1>

      <Collapsible title="Gudino Custom Cabinets - SMS Communication Policy">
      <p>
        Gudino Custom Cabinets uses text messaging to keep customers informed
        about their cabinet projects. We only send SMS notifications when
        invoices are complete or modified, ensuring you stay updated on your
        project's financial status.
      </p>
      </Collapsible>

      <Collapsible title="Our Verbal Consent Process">
      <p>
        When customers accept our cabinet bid, we obtain verbal consent for SMS
        communications through the following process:
      </p>
      <ul className="sms-list">
        <li>
          <strong>Timing:</strong> Consent is obtained immediately when
          customers accept our bid
        </li>
        <li>
          <strong>Staff Training:</strong> All staff members are trained to
          explain our SMS notification system
        </li>
        <li>
          <strong>Clear Explanation:</strong> We explain that messages are sent
          when invoices are complete or modified
        </li>
        <li>
          <strong>Documentation:</strong> We record the date, customer name,
          phone number, staff member, and project number
        </li>
        <li>
          <strong>Opt-out Information:</strong> Customers are informed they can
          text STOP anytime to opt out
        </li>
      </ul>

      <div className="sms-highlight-box">
        <strong>Verbal Consent Script Used by Our Staff:</strong>
        <br />
        <br />
        "Now that you've accepted our bid, Gudino Custom Cabinets will send text
        messages when your invoice is ready, if changes are made, and for
        payment reminders. You'll receive 2-4 messages during your project.
        Message and data rates may apply. You can text STOP anytime to opt out.
        Is it okay if we send updates to [phone number]?"
      </div>

      <div className="sms-section-header">What We Document</div>
      <ul className="sms-list">
        <li>Date and time of consent</li>
        <li>Customer name and phone number</li>
        <li>Staff member who obtained consent</li>
        <li>Project number for reference</li>
        <li>Confirmation that customer agreed to receive SMS notifications</li>
      </ul>
      </Collapsible>
    
      <Collapsible title="When Messages Are Sent">
      <p>We send automated SMS notifications in the following situations:</p>
      <ul className="sms-list">
        <li>When an invoice is created and ready for review</li>
        <li>When changes are made to an existing invoice</li>
        <li>Payment reminders for outstanding invoices</li>
      </ul>
      </Collapsible>
      <Collapsible title="Sample SMS Messages">
        <Collapsible title="Invoice Ready Notification">
          <div className="sms-sample-message">
            Gudino Custom Cabinets: Your invoice #4523 for $2,850.00 is ready. View:
            [link]. Reply STOP to opt out.
          </div>
        </Collapsible>

        <Collapsible title="Invoice Modified Notification">
          <div className="sms-sample-message">
            Gudino Custom Cabinets: Invoice #4523 has been updated. New amount:
            $3,150.00. View changes: [link].
          </div>
        </Collapsible>

        <Collapsible title="Payment Reminder">
          <div className="sms-sample-message">
            Gudino Custom Cabinets: Invoice #4523 ($2,850) is due in 3 days. Pay:
            [link]. Reply STOP to opt out.
          </div>
        </Collapsible>
      </Collapsible>
      <Collapsible title= "Message Frequency">
      <p>
        Customers typically receive 2-4 text messages throughout their entire
        cabinet project. We only send messages when there are actual updates to
        invoices or payment reminders.
      </p>
      </Collapsible>
      <Collapsible title="Opt-Out Process">
      <p>
        Customers can opt out at any time by texting STOP to (509) 790-3516.
        Once opted out, no further SMS messages will be sent for that phone
        number.
      </p>
      </Collapsible>
    </>
  );

  const TermsContent = () => (
    <>
      <h1 className="sms-header">SMS Terms & Conditions</h1>

      <Collapsible title="Message Frequency" >
        <p>
          You will receive approximately 2-4 text messages per cabinet project.
          Messages are sent only when:
        </p>
        <ul className="sms-list">
          <li>Your invoice is ready for review</li>
          <li>Changes are made to your invoice</li>
          <li>Payment reminders are due</li>
        </ul>
      </Collapsible>

      <Collapsible title="Opt-Out Instructions">
        <p>To stop receiving text messages:</p>
        <ul className="sms-list">
          <li>
            Text <strong>STOP</strong> to (509) 790-3516
          </li>
          <li>You will receive a confirmation message</li>
          <li>No further messages will be sent to your number</li>
        </ul>
      </Collapsible>

      <Collapsible title="Help">
        <p>
          For help with text messages, text <strong>HELP</strong> to (509)
          790-3516 or call us at (509) 515-4090.
        </p>
      </Collapsible>

      <Collapsible title="Message & Data Rates">
        <p>
          Message and data rates may apply based on your mobile carrier plan.
          Standard messaging rates apply.
        </p>
      </Collapsible>

      <Collapsible title="Supported Carriers">
        <p>Our SMS service works with all major carriers including:</p>
        <ul className="sms-list">
          <li>Verizon Wireless</li>
          <li>AT&T</li>
          <li>T-Mobile</li>
          <li>Sprint</li>
          <li>US Cellular</li>
          <li>Cricket Wireless</li>
          <li>MetroPCS</li>
          <li>Boost Mobile</li>
          <li>Virgin Mobile</li>
          <li>And other major carriers</li>
        </ul>
      </Collapsible>

      <Collapsible title="Service Availability">
        <p>
          SMS service is available 24/7. However, messages are typically sent
          during business hours when invoices are processed and updated.
        </p>
      </Collapsible>

      <Collapsible title="Contact Information">
        <p>
          Gudino Custom Cabinets
          <br />
          Phone: (509) 515-4090
          <br />
          SMS Opt-out: Text STOP to (509) 790-3516
          <br />
          SMS Help: Text HELP to (509) 790-3516
        </p>
      </Collapsible>
    </>
  );

  const PrivacyContent = () => (
    <>
      <h1 className="sms-header">Privacy Policy - SMS Communications</h1>

      <Collapsible title="Information We Collect" >
        <p>For SMS communications, we collect and store:</p>
        <ul className="sms-list">
          <li>Your phone number</li>
          <li>Your name</li>
          <li>Opt-in/opt-out status</li>
        </ul>
      </Collapsible>

      <Collapsible title="How We Use Your Information">
        <p>We use your phone number and related information solely to:</p>
        <ul className="sms-list">
          <li>Send notifications when your invoice is ready</li>
          <li>Notify you of changes made to your invoice</li>
          <li>Send payment reminders for outstanding invoices</li>
          <li>Process opt-out requests</li>
          <li>Maintain records for compliance purposes</li>
        </ul>
      </Collapsible>

      <Collapsible title="Information Sharing">
        <p>
          <strong>
            We never sell, rent, or share your phone number with third parties.
          </strong>
        </p>
        <p>
          Your phone number is only used by Gudino Custom Cabinets for the
          purposes outlined above.
        </p>
      </Collapsible>

      <Collapsible title="Data Security">
        <p>We protect your information through:</p>
        <ul className="sms-list">
          <li>Secure storage of all customer data</li>
          <li>Limited access to authorized staff only</li>
          <li>Regular security updates and monitoring</li>
          <li>Compliance with industry best practices</li>
        </ul>
      </Collapsible>

      <Collapsible title="Data Retention">
        <p>We retain your SMS consent records for:</p>
        <ul className="sms-list">
          <li>The duration of your cabinet project</li>
          <li>Plus 3 years after project completion for compliance purposes</li>
          <li>Until you request deletion (see Your Rights section)</li>
        </ul>
      </Collapsible>

      <Collapsible title="Your Rights">
        <p>You have the right to:</p>
        <ul className="sms-list">
          <li>
            <strong>Opt out:</strong> Text STOP to (509) 790-3516 at any time
          </li>
          <li>
            <strong>Request deletion:</strong> Ask us to delete your phone number
            from our SMS system
          </li>
          <li>
            <strong>Update information:</strong> Correct any inaccurate
            information we have
          </li>
          <li>
            <strong>Access records:</strong> Request to see what SMS consent
            information we have about you
          </li>
        </ul>
      </Collapsible>

      <Collapsible title="Consent Withdrawal">
        <p>
          You may withdraw your consent for SMS communications at any time by
          texting STOP to (509) 790-3516. This will immediately remove you from
          our SMS system, though it will not affect other forms of communication
          about your cabinet project.
        </p>
      </Collapsible>

      <Collapsible title="Changes to This Policy">
        <p>
          If we make changes to this SMS privacy policy, we will notify you via
          text message before implementing any changes that affect how we use your
          information.
        </p>
      </Collapsible>

      <Collapsible title="Contact Us">
        <p>
          For questions about this privacy policy or your SMS communications:
          <br />
          Gudino Custom Cabinets
          <br />
          Phone: (509) 515-4090
          <br />
          Email: info@gudinocustom.com
        </p>

        <p>
          <em>Last updated: {new Date().toLocaleDateString()}</em>
        </p>
      </Collapsible>
    </>
  );
 
  const renderContent = () => {
    switch (activeTab) {
      case "website":
        return <WebsitePrivacy />;
      case "consent":
        return <ConsentContent />;
      case "terms":
        return <TermsContent />;
      case "privacy":
        return <PrivacyContent />;
      case "cabinetCare":
        return <CabinetCareContent />;
      default:
        return <WebsitePrivacy />;
    }
  };

  return (
    <div>
      <Navigation />
      <div style={{ height: "3vh" }}></div>
      <div className="sms-compliance-container">
        <div className="sms-tabs-container">
          <button
            className={`sms-tab-button ${
              activeTab === "website" ? "active" : ""
            }`}
            onClick={() => setActiveTab("website")}
          >
            Website Privacy
          </button>
          <button
            className={`sms-tab-button ${
              activeTab === "consent" ? "active" : ""
            }`}
            onClick={() => setActiveTab("consent")}
          >
            SMS Consent
          </button>
          <button
            className={`sms-tab-button ${
              activeTab === "terms" ? "active" : ""
            }`}
            onClick={() => setActiveTab("terms")}
          >
            SMS Terms
          </button>
          <button
            className={`sms-tab-button ${
              activeTab === "privacy" ? "active" : ""
            }`}
            onClick={() => setActiveTab("privacy")}
          >
            SMS Privacy
          </button>
          <button
            className={`sms-tab-button ${
              activeTab === "cabinetCare" ? "active" : ""
            }`}
            onClick={() => setActiveTab("cabinetCare")}
          >
            Cabinet Care
          </button>
        </div>

        <div className="sms-content">{renderContent()}</div>
      </div>
      <div style={{ height: "2vh" }}></div>
    </div>
  );
};

export default SmsCompliance;
