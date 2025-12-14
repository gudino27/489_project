import "../css/sms-compliance.css";
import Collapsible from "../ui/Collapsible";
import Navigation from "../ui/Navigation";

const WhyChooseUs = () => {
  return (
    <div>
      <Navigation />
      <div style={{ height: "1vh" }}></div>
      <div className="sms-compliance-container">
        <div className="sms-content">
          <h1 className="sms-header">Why Choose Gudino Custom Woodworking</h1>
          <p>
            <em>Experience the difference of custom craftsmanship and professional installation</em>
          </p>

          <Collapsible title="What Sets Us Apart" defaultOpen={true}>
            <p>
              We handle everything from design to installation with experienced craftsmen, so you get
              consistent quality and precision throughout your entire project.
            </p>

            <ul className="sms-list">
              <li style={{ marginTop: "12px" }}>
                <strong>Everything Handled In-House</strong>
                <p>
                  Every step from design to installation is done by our experienced craftsmen.
                  No third parties, just consistent quality and precision.
                </p>
              </li>
              <li style={{ marginTop: "12px" }}>
                <strong>Perfect Fit, Every Time</strong>
                <p>
                  We measure on-site and plan carefully so your cabinets fit your space exactly.
                </p>
              </li>
              <li style={{ marginTop: "12px" }}>
                <strong>Built to Last</strong>
                <p>
                  We use quality materials and proven construction techniques that stand up to
                  daily use for years.
                </p>
              </li>
              <li style={{ marginTop: "12px" }}>
                <strong>Direct Communication</strong>
                <p>
                  You work directly with our team no middlemen, no confusion. Just clear answers
                  and responsive service.
                </p>
              </li>
              <li style={{ marginTop: "12px" }}>
                <strong>Better Scheduling</strong>
                <p>
                  Fewer people involved means better timelines, fewer delays, and a smoother
                  experience overall.
                </p>
              </li>
              <li style={{ marginTop: "12px" }}>
                <strong>Quality That Lasts</strong>
                <p>
                  When craftsmanship and installation are both done right, you get cabinets that
                  look great and work well for the long haul.
                </p>
              </li>
            </ul>

            <div className="sms-highlight-box">
              <strong>See the Difference for Yourself</strong>
              <br /><br />
              If you want cabinets that are designed, built, and installed without cutting corners,
              let's talk. Schedule a consultation and we'll walk you through how we work.
            </div>
          </Collapsible>

          <Collapsible title="Why We're Different from Big-Box Stores">
            <p><strong>Common Problems with Big-Box Cabinet Orders</strong></p>
            <p>
              Big-box stores are convenient, but cabinet orders often come with headaches that
              can delay your project and affect the final result:
            </p>

            <ul className="sms-list">
              <li style={{ marginTop: "12px" }}>
                <strong>Measurements Gone Wrong</strong>
                <p>
                  Third parties or homeowners take the measurements, which can lead to cabinets
                  that don't actually fit when they arrive.
                </p>
              </li>
              <li style={{ marginTop: "12px" }}>
                <strong>Long Waits and Delays</strong>
                <p>
                  Orders can take weeks or months, and delays from backorders or shipping issues
                  are pretty common.
                </p>
              </li>
              <li style={{ marginTop: "12px" }}>
                <strong>Missing or Damaged Pieces</strong>
                <p>
                  Cabinets often arrive incomplete or damaged, which means more waiting while
                  replacements are ordered.
                </p>
              </li>
              <li style={{ marginTop: "12px" }}>
                <strong>Hit-or-Miss Quality</strong>
                <p>
                  Materials and construction can vary a lot, leading to uneven finishes, cheap
                  hardware, or cabinets that don't hold up.
                </p>
              </li>
              <li style={{ marginTop: "12px" }}>
                <strong>Hard to Get Help</strong>
                <p>
                  With multiple vendors in the mix, getting straight answers or timely fixes
                  can be frustrating.
                </p>
              </li>
            </ul>

            <div className="sms-highlight-box">
              <strong>Skip the Hassle</strong>
              <br /><br />
              Avoid the delays and confusion that come with big-box cabinet orders. With us,
              you work directly with the people building and installing your cabinets so things
              get done right the first time.
            </div>
          </Collapsible>

          <Collapsible title="Why Installation Matters">
            <p><strong>What Can Go Wrong with Poor Installation</strong></p>
            <p>
              Great cabinets can look and perform poorly if they're not installed properly.
              Here are some common issues:
            </p>

            <ul className="sms-list">
              <li style={{ marginTop: "12px" }}>
                <strong>Cabinets That Aren't Level</strong>
                <p>
                  When cabinets aren't level, doors swing open on their own, drawers stick,
                  and everything looks crooked.
                </p>
              </li>
              <li style={{ marginTop: "12px" }}>
                <strong>Poor Wall Attachment</strong>
                <p>
                  Cabinets that aren't secured properly can loosen over time or pull away
                  from the wall a safety issue.
                </p>
              </li>
              <li style={{ marginTop: "12px" }}>
                <strong>Doors and Drawers That Don't Line Up</strong>
                <p>
                  Uneven alignment causes rubbing, sticking, and gaps that look sloppy.
                </p>
              </li>
              <li style={{ marginTop: "12px" }}>
                <strong>Not Enough Support for Upper Cabinets</strong>
                <p>
                  Wall cabinets need proper support or they'll sag and separate once you
                  start using them.
                </p>
              </li>
              <li style={{ marginTop: "12px" }}>
                <strong>Gaps from Uneven Walls or Floors</strong>
                <p>
                  If the installer doesn't address uneven surfaces, you'll end up with
                  visible gaps and a poor fit.
                </p>
              </li>
              <li style={{ marginTop: "12px" }}>
                <strong>Wrong Spacing Around Appliances</strong>
                <p>
                  Incorrect clearances can make it hard to install appliances or use them properly.
                </p>
              </li>
            </ul>

            <div className="sms-highlight-box">
              <strong>Protect Your Investment</strong>
              <br /><br />
              Good installation is just as important as good craftsmanship. We install your
              cabinets correctly and securely so they look great and work well for years to come.
            </div>
          </Collapsible>
        </div>
      </div>
      <div style={{ height: "3vh" }}></div>
    </div>
  );
};

export default WhyChooseUs;
