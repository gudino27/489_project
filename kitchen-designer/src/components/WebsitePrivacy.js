import React from 'react';
import './css/sms-compliance.css';
import Collapsible from './ui/Collapsible';
import { useLanguage } from '../contexts/LanguageContext';

const WebsitePrivacy = () => {
  const { t } = useLanguage();

  return (
    <>
      <h1 className="sms-header">{t("websitePrivacy.header")}</h1>
      <p><em>{t("websitePrivacy.effective")}</em></p>

      <Collapsible title={t("websitePrivacy.commitment.title")}>
        <p>{t("websitePrivacy.commitment.content")}</p>
      </Collapsible>

      <Collapsible title={t("websitePrivacy.collect.title")}>
        <div><strong>{t("websitePrivacy.collect.tracking")}</strong></div>
        <p>{t("websitePrivacy.collect.intro")}</p>
        <ul className="sms-list">
          <li><strong>{t("websitePrivacy.collect.location")}</strong></li>
          <li><strong>{t("websitePrivacy.collect.ip")}</strong></li>
          <li><strong>{t("websitePrivacy.collect.device")}</strong></li>
          <li><strong>{t("websitePrivacy.collect.timestamp")}</strong></li>
        </ul>
        <div className="sms-highlight-box">
          <strong>{t("websitePrivacy.collect.note")}</strong>
        </div>
      </Collapsible>

      <Collapsible title={t("websitePrivacy.how.title")}>
        <ul className="sms-list">
          <li><strong>{t("websitePrivacy.how.selfhosted")}</strong></li>
          <li><strong>{t("websitePrivacy.how.browser")}</strong></li>
        </ul>
      </Collapsible>

      <Collapsible title={t("websitePrivacy.why.title")}>
        <p>{t("websitePrivacy.why.intro")}</p>
        <ul className="sms-list">
          <li><strong>{t("websitePrivacy.why.fraud")}</strong></li>
          <li><strong>{t("websitePrivacy.why.delivery")}</strong></li>
          <li><strong>{t("websitePrivacy.why.security")}</strong></li>
        </ul>
      </Collapsible>

      <Collapsible title={t("websitePrivacy.sharing.title")}>
        <div className="sms-highlight-box">
          <strong>{t("websitePrivacy.sharing.never")}</strong>
        </div>
        <p>{t("websitePrivacy.sharing.servers")}</p>
        <p><strong>{t("websitePrivacy.sharing.exception")}</strong></p>
      </Collapsible>

      <Collapsible title={t("websitePrivacy.retention.title")}>
        <p>{t("websitePrivacy.retention.intro")}</p>
        <ul className="sms-list">
          <li><strong>{t("websitePrivacy.retention.testimonial")}</strong></li>
          <li><strong>{t("websitePrivacy.retention.invoice")}</strong></li>
          <li><strong>{t("websitePrivacy.retention.session")}</strong></li>
        </ul>
      </Collapsible>

      <Collapsible title={t("websitePrivacy.exercise.title")}>
        <p>{t("websitePrivacy.exercise.intro")}</p>
        <ul className="sms-list">
          <li>{t("websitePrivacy.exercise.email")} <strong>Admin@gudinocustom.com</strong></li>
          <li>{t("websitePrivacy.exercise.phone")} <strong>(509) 515-4090</strong></li>
          <li>{t("websitePrivacy.exercise.respond")}</li>
        </ul>
      </Collapsible>

      <Collapsible title={t("websitePrivacy.dnt.title")}>
        <p>{t("websitePrivacy.dnt.content")}</p>
      </Collapsible>

      <Collapsible title={t("websitePrivacy.security.title")}>
        <p>{t("websitePrivacy.security.intro")}</p>
        <ul className="sms-list">
          <li>{t("websitePrivacy.security.https")}</li>
          <li>{t("websitePrivacy.security.servers")}</li>
          <li>{t("websitePrivacy.security.access")}</li>
          <li>{t("websitePrivacy.security.monitoring")}</li>
          <li>{t("websitePrivacy.security.practices")}</li>
        </ul>
      </Collapsible>

      <Collapsible title={t("websitePrivacy.children.title")}>
        <p>{t("websitePrivacy.children.content")}</p>
      </Collapsible>

      <Collapsible title={t("websitePrivacy.policychanges.title")}>
        <p>{t("websitePrivacy.policychanges.content")}</p>
      </Collapsible>

      <Collapsible title={t("websitePrivacy.contact.title")}>
        <p>
          {t("websitePrivacy.contact.intro")}<br/><br/>
          <strong>{t("websitePrivacy.contact.company")}</strong><br/>
          {t("websitePrivacy.contact.privacy")}<br/>
          {t("websitePrivacy.contact.phone")}<br/>
          {t("websitePrivacy.contact.address")}<br/>
        </p>
      </Collapsible>

      <Collapsible title={t("websitePrivacy.state.title")}>
        <p><strong>{t("websitePrivacy.state.washington")}</strong></p>
        <p>{t("websitePrivacy.state.washington.content")}</p>
        <p><strong>{t("websitePrivacy.state.california")}</strong></p>
        <p>{t("websitePrivacy.state.california.intro")}</p>
        <ul className="sms-list">
          <li>{t("websitePrivacy.state.california.know")}</li>
          <li>{t("websitePrivacy.state.california.delete")}</li>
          <li>{t("websitePrivacy.state.california.optout")}</li>
          <li>{t("websitePrivacy.state.california.nondiscrimination")}</li>
        </ul>
      </Collapsible>
    </>
  );
};

export default WebsitePrivacy;
