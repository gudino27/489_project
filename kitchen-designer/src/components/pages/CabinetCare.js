import "../css/sms-compliance.css";
import Collapsible from "../ui/Collapsible";
import Navigation from "../ui/Navigation";

const CabinetCare = () => {
  return (
    <div>
      <Navigation />
      <div style={{ height: "3vh" }}></div>
      <div className="sms-compliance-container">
        <div className="sms-content">
          <h1 className="sms-header">Cabinet Care, Cleaning & Warranty Guide</h1>
          <p>
            <em>Care instructions and warranty Guide for Gudino Custom Cabinets</em>
          </p>

          <Collapsible title="Cabinet Care & Maintenance">
            <p
              style={{
                borderBottom: "2px solid rgba(255, 255, 255, 0.3)",
                paddingBottom: "12px",
                marginBottom: "12px",
              }}
            >
              Our cabinets are built with quality materials and craftsmanship. Proper
              care and a stable home environment are essential to maintaining their
              appearance and performance over time. Please review the following
              guidelines to help protect your cabinetry.{" "}
            </p>
          </Collapsible>

          <Collapsible title="Areas Requiring Special Attention">
            <ul className="sms-list">
              <li style={{ marginTop: "12px" }}>
                {" "}
                <strong>Sink Areas</strong>
              </li>
              <p>
                Cabinets near sinks are frequently exposed to water. Farm and apron
                sink cabinets are especially susceptible. Wipe up water immediately
                and keep surfaces dry to prevent damage.{" "}
              </p>
              <li style={{ marginTop: "12px" }}>
                <strong>Self-Cleaning Ovens</strong>
              </li>
              <p>
                The extreme heat produced during self-cleaning cycles may damage
                surrounding cabinetry. To reduce risk, remove cabinet doors and
                drawers adjacent to the oven before using this feature
              </p>
              <li style={{ marginTop: "12px" }}>
                <strong> Countertop Appliances</strong>
              </li>
              <p>
                Appliances such as coffee makers, instant pots, and crockpots release
                heat and steam. Avoid placing them where steam vents directly toward
                cabinet surfaces, as this may cause permanent damage.
              </p>
              <li style={{ marginTop: "12px" }}>
                <strong> Trash Pull-Outs</strong>
              </li>
              <p>
                Trash cabinets experience frequent use. Clean these areas regularly
                and inspect for chips or scratches to the cabinet finish.
              </p>
              <li style={{ marginTop: "12px" }}>
                <strong> Dishwashers</strong>
                <p>
                  Dishwashers generate heat and steam during operation. After use, dry
                  nearby cabinet surfaces to help prevent moisture-related damage.
                </p>
              </li>
              <li style={{ marginTop: "12px" }}>
                <strong> Cooktops</strong>
                <p>
                  Cabinetry around cooktops may be exposed to heat, humidity, and
                  cooking splatter. Clean and dry surrounding areas promptly to
                  prevent staining or deterioration.
                </p>
              </li>
            </ul>
            <div className="sms-highlight-box">
              <strong>IMPORTANT:</strong> These areas require regular attention to remain clean and dry
              and to avoid damage.
            </div>
            <div
              style={{
                borderBottom: "2px solid rgba(255, 255, 255, 0.3)",
                paddingBottom: "12px",
                marginBottom: "12px",
              }}
            ></div>
          </Collapsible>

          <Collapsible title="Cabinet Care & Maintenance Guidelines">
            <ul className=" sms-list">
              <li style={{ marginTop: "12px" }}>
                {" "}
                <strong> Routine Care </strong>
                <p style={{ marginTop: "12px" }}>
                  Clean spills and splatters promptly and dry thoroughly.
                </p>
                <p>Do not place damp cloths or towels on cabinet surfaces. </p>
                <p>
                  Remove excess moisture from cabinet areas exposed to higher
                  humidity.{" "}
                </p>
                <p>Avoid impacts that may chip or scratch cabinet finishes. </p>
                <p>Regularly monitor the areas listed above.</p>
              </li>
              <li style={{ marginTop: "12px" }}>
                <strong>Periodic Cleaning</strong>
                <p style={{ marginTop: "12px" }}>
                  Maintain a consistent indoor temperature and humidity level.
                </p>
                <p>Clean cabinet exteriors several times per year.</p>
                <p>Clean small sections at a time for best results.</p>
                <p>
                  Remove oils and residue that may build up around knobs and pulls.
                </p>
              </li>
            </ul>
            <div className="sms-highlight-box">
              <strong>IMPORTANT:</strong> Improper cleaning, care, or maintenance may result in
              permanent damage to cabinetry.
            </div>
            <div
              style={{
                borderBottom: "2px solid rgba(255, 255, 255, 0.3)",
                paddingBottom: "12px",
                marginBottom: "12px",
              }}
            ></div>
          </Collapsible>

          <Collapsible title="Maintaining a Proper Home Environment">
            <ul className=" sms-list">
              <li style={{ marginTop: "12px" }}>
                {" "}
                <strong> Humidity & Moisture</strong>
                <p style={{ marginTop: "12px" }}>
                  Excess moisture can cause cabinetry to swell, crack, or warp.
                </p>
                <p>Ensure kitchens and bathrooms are properly ventilated.</p>
                <p>Maintain indoor relative humidity between 35% and 50%.</p>
              </li>
              <li style={{ marginTop: "12px" }}>
                <strong>sunlight</strong>
                <p style={{ marginTop: "12px" }}>
                  Natural sunlight and UV exposure can affect cabinet color over time.
                </p>
                <p>Wood and painted finishes may fade, darken, or discolor.</p>
                <p>
                  Mellowing refers to the natural color change that occurs in wood
                  when exposed to light.
                </p>
              </li>
              <li style={{ marginTop: "12px" }}>
                <strong>Temperature</strong>
                <p style={{ marginTop: "12px" }}>
                  Maintain indoor temperatures between 60º and 80º Fahrenheit.
                </p>
                <p>
                  Significant temperature fluctuations may cause cabinet materials to
                  expand or contract.
                </p>
                <p>Heat from self-cleaning ovens may also affect nearby cabinetry.</p>
              </li>
            </ul>
            <div className="sms-highlight-box">
              <strong>IMPORTANT:</strong> Exposure to extreme humidity, moisture, temperature, or
              sunlight may cause permanent damage.
            </div>
            <div
              style={{
                borderBottom: "2px solid rgba(255, 255, 255, 0.3)",
                paddingBottom: "12px",
                marginBottom: "12px",
              }}
            ></div>
          </Collapsible>

          <Collapsible title="Cleaning Your Cabinets">
            <p>
              Proper cleaning helps maintain the appearance and finish of your
              cabinetry. Follow the guidelines below to ensure safe and effective
              cleaning.{" "}
            </p>
            <ul className="sms-list">
              <li style={{ marginTop: "12px" }}>
                <strong>Routine Cleaning</strong>
                <p style={{ marginTop: "12px" }}>
                  Wipe spills immediately using a clean, soft cloth dampened with warm
                  water. After cleaning, dry the surface right away using a second
                  clean, soft cloth.
                </p>
                <p style={{ marginTop: "12px" }}>
                  For regular cleaning, simply wipe cabinet surfaces with a microfiber
                  cloth dampened with warm water. Always follow by drying with a
                  clean, soft cloth.
                </p>
              </li>
              <li style={{ marginTop: "12px" }}>
                <strong> Removing Grease and Tougher Spills</strong>
                <p style={{ marginTop: "12px" }}>
                  To remove oil, grease, food residue, or more stubborn spills, use a
                  clean, soft cloth dampened with a mild dishwashing liquid and warm
                  water solution. We recommend mixing{" "}
                  <strong>
                    {" "}
                    four to five drops of Dawn® dish soap per one gallon of water.
                  </strong>{" "}
                  After cleaning, immediately dry the surface with a second clean,
                  soft cloth.
                </p>
              </li>
            </ul>
            <p
              style={{
                marginTop: "12px",
                borderBottom: "2px solid rgba(255, 255, 255, 0.3)",
                paddingBottom: "12px",
                marginBottom: "12px",
              }}
            >
              Always wipe in the direction of the wood grain
            </p>
          </Collapsible>

          <Collapsible title="Products to Avoid">
            <p>
              Using the wrong cleaning products can permanently damage your cabinet
              finish.{" "}
            </p>
            <ul className="sms-list">
              <li style={{ marginTop: "12px" }}>
                <strong>Harsh Cleaners</strong>
                <p style={{ marginTop: "12px" }}>
                  Avoid cleaners that contain bleach, ammonia, citrus ingredients,
                  mineral oil, harsh detergents, strong soaps, or abrasive agents.
                </p>
                <p>
                  Examples of cleaners to avoid include:
                  <strong>
                    {" "}
                    409®, Simple Green®, glass cleaners, and Clorox®.
                  </strong>{" "}
                </p>
              </li>
              <li style={{ marginTop: "12px" }}>
                <strong>Waxes & Polishers</strong>
                <p style={{ marginTop: "12px" }}>
                  Cleaners containing waxes can cause buildup over time, leading to a
                  yellowed appearance.
                </p>
                <p>
                  Many self-polishing products, especially those containing silicone,
                  can damage cabinet finishes.
                </p>
                <p>Polishes may also attract and hold dust.</p>
                <p>
                  Examples to avoid include:
                  <strong>
                    Johnson Paste Wax®, Liquid Gold®, Pledge®, and Old English®.
                  </strong>
                </p>
              </li>
              <li style={{ marginTop: "12px" }}>
                <strong>Abrasives</strong>
                <p style={{ marginTop: "12px" }}>
                  Abrasive cleaners, scouring pads, and abrasive liquids or powders
                  can scratch and dull cabinet finishes.
                </p>
                <p>
                  Avoid products such as:{" "}
                  <strong>
                    Ajax®, Soft Scrub®, Comet®, baking soda, Scotch-Brite® pads, steel
                    wool, and Magic Erasers®.
                  </strong>
                </p>
              </li>
              <li style={{ marginTop: "12px" }}>
                <strong>Sponges & Dishcloths</strong>
                <p style={{ marginTop: "12px" }}>
                  Do not use everyday kitchen sponges or dishcloths. These may contain
                  food particles, oils, or
                </p>
                <p>
                  residues from other cleaners and may scratch the cabinet surface.
                </p>
              </li>
            </ul>
            <div
              style={{
                marginTop: "12px",
                borderBottom: "2px solid rgba(255, 255, 255, 0.3)",
                paddingBottom: "12px",
                marginBottom: "12px",
              }}
            ></div>
          </Collapsible>

          <Collapsible title="Specialty Cleaning Areas">
            <ul className="sms-list">
              <li style={{ marginTop: "12px" }}>
                {" "}
                <strong> Glass Doors</strong>
                <p style={{ marginTop: "12px" }}>
                  Spray an ammonia-free glass cleaner onto a lint-free cloth, then
                  wipe the glass.
                </p>
                <p>
                  Do not spray cleaner directly onto the glass or cabinet surface, as
                  overspray or drips may
                </p>
                <p>damage surrounding finishes.</p>
              </li>
              <li style={{ marginTop: "12px" }}>
                <strong> Maple Chopping Block</strong>
                <p style={{ marginTop: "12px" }}>
                  Occasionally reseal with a food-grade mineral or vegetable oil to
                  help preserve the surface.
                </p>
                <p>Apply oil only to frequently used areas.</p>
                <p>
                  With years of heavy use, refinishing may be required. Lightly sand
                  the surface and reseal using
                </p>
                <p>
                  mineral oil, vegetable oil, or a clear urethane gel protective
                  finish such as <strong>Good Stuff®.</strong>
                </p>
                <p>Always follow safe food-handling guidelines.</p>
              </li>
              <li style={{ marginTop: "12px" }}>
                <strong> Bread Board</strong>
                <p style={{ marginTop: "12px" }}>
                  Clean thoroughly after each use with a clean, soft cloth dampened
                  with mild dishwashing liquid
                </p>
                <p>and warm water.</p>
                <p>
                  Do not soak the breadboard in water or place it in the dishwasher.
                </p>
                <p>Always follow safe food-handling guidelines.</p>
              </li>
            </ul>
          </Collapsible>

          <Collapsible title="Warranty Information">
            <ul className="sms-list">
              <li
                style={{
                  marginTop: "12px",
                  borderBottom: "2px solid rgba(255, 255, 255, 0.3)",
                  paddingBottom: "12px",
                  marginBottom: "12px",
                }}
              >
                <strong>Who Does This Warranty Apply To?</strong>
                <p style={{ marginTop: "12px" }}>
                  This warranty applies to the original purchaser of the products who
                  owns them at the original
                </p>
                <p>
                  site of installation.
                  <strong>
                    {" "}
                    Failure by the consumer to provide proof of purchase voids any
                    claim
                  </strong>
                </p>
                <p style={{ marginBottom: "12px" }}>
                  <strong> made under this warranty.</strong>
                </p>
              </li>
              <li
                style={{
                  marginTop: "12px",
                  borderBottom: "2px solid rgba(255, 255, 255, 0.3)",
                  paddingBottom: "12px",
                  marginBottom: "12px",
                }}
              >
                <strong> What Does This Limited Warranty Cover? </strong>
                <p style={{ marginTop: "12px" }}>
                  This limited warranty covers defects in materials and workmanship in
                  your <strong> Gudino Custom</strong>
                </p>
                <p>
                  {" "}
                  <strong>Woodworking</strong> custom cabinetry under normal
                  residential use and service.
                </p>
              </li>
              <li>
                <strong> What Will Gudino Custom Woodworking Do?</strong>
                <p style={{ marginTop: "12px" }}>
                  <strong>Gudino Custom Woodworking</strong> will repair or replace
                  any part or parts that are determined to
                </p>
                <p>be defective under normal home use and service.</p>
              </li>
            </ul>
            <div
              style={{
                marginTop: "12px",
                borderBottom: "2px solid rgba(255, 255, 255, 0.3)",
                paddingBottom: "12px",
                marginBottom: "12px",
              }}
            ></div>
          </Collapsible>

          <Collapsible title="Lifetime Limited Warranty">
            <ul className="sms-list">
              <li style={{ marginTop: "12px" }}>
                <strong>Effect on Implied Warranties</strong>{" "}
              </li>{" "}
              <p style={{ marginTop: "12px" }}>
                <strong> Gudino Custom Woodworking</strong> makes no other warranties
                of any kind, either express or
              </p>
              <p>
                implied. All implied warranties, including warranties of
                merchantability and fitness for a particular
              </p>
              <p>
                purpose, are excluded from this transaction and do not apply to the
                goods sold unless the
              </p>
              <p>
                goods qualify as "consumer products" as defined by the federal
                Magnuson-Moss Warranty Act.
              </p>
              <p>
                Some states do not allow limitations on implied warranties, so these
                limitations may not apply to
              </p>
              <p>you.</p>
            </ul>
            <div
              style={{
                marginTop: "12px",
                borderBottom: "2px solid rgba(255, 255, 255, 0.3)",
                paddingBottom: "12px",
                marginBottom: "12px",
              }}
            ></div>
          </Collapsible>

          <Collapsible title="What Is Not Covered Under This Warranty">
            <ul className="sms-list">
              <li style={{ marginTop: "12px" }}>
                <strong>Hairline Cracking</strong>
                <p style={{ marginTop: "12px" }}>
                  Visible cracking at joints in painted face frames, doors, and other
                  painted products is considered
                </p>
                <p>
                  a natural characteristic of wood. Wood expands and contracts with
                  changes in temperature and
                </p>
                <p>humidity and is not covered under this or any implied warranty.</p>
              </li>
              <li style={{ marginTop: "12px" }}>
                <strong>Mellowing or Fading</strong>
                <p style={{ marginTop: "12px" }}>
                  Natural mellowing, fading, or aging of wood products caused by
                  photo-degradation, including
                </p>
                <p>exposure to natural or artificial light, is not covered.</p>
              </li>
              <li style={{ marginTop: "12px" }}>
                <strong>Installation</strong>
                <p style={{ marginTop: "12px" }}>
                  This warranty does not cover damage caused by improper handling or
                  installation. Door and
                </p>
                <p>
                  drawer alignment issues resulting from cabinets installed out of
                  level, square, or plumb are not
                </p>
                <p>covered.</p>
                <p>
                  This warranty does not include labor or costs associated with
                  removal or reinstallation of any
                </p>
                <p>product.</p>
              </li>
            </ul>
            <div
              style={{
                marginTop: "12px",
                borderBottom: "2px solid rgba(255, 255, 255, 0.3)",
                paddingBottom: "12px",
                marginBottom: "12px",
              }}
            ></div>
          </Collapsible>

          <Collapsible title="What Will Void the Warranty">
            <p style={{ marginTop: "12px" }}>
              Products determined to have been neglected, abused, misused, or
              improperly maintained are{" "}
            </p>
            <p>
              not covered. Failure by the consumer to provide proof of purchase voids
              any claim made{" "}
            </p>
            <p>under this warranty. </p>
            <ul className="sms-list">
              <li style={{ marginTop: "12px" }}>
                <strong>Water Damage</strong>
                <p style={{ marginTop: "12px" }}>
                  Damage caused by water exposure or the use of damp cloths on
                  cabinetry is considered
                </p>
                <p>improper care and will void the warranty.</p>
              </li>
              <li style={{ marginTop: "12px" }}>
                <strong>Neglected Chips & Scratches</strong>
                <p style={{ marginTop: "12px" }}>
                  Failure to properly touch up chips or scratches is considered
                  improper maintenance. Untreated
                </p>
                <p>
                  damage may lead to future product failure and will void the
                  warranty.
                </p>
              </li>
              <li style={{ marginTop: "12px" }}>
                <strong>Product Modifications</strong>
                <p style={{ marginTop: "12px" }}>
                  This warranty does not cover damage resulting from job-site
                  modifications, disassembly,
                </p>
                <p>refinishing, or other alterations to the product.</p>
              </li>
              <li style={{ marginTop: "12px" }}>
                <strong>Improper Storage</strong>
                <p style={{ marginTop: "12px" }}>
                  Products stored in uncontrolled environments before or during
                  installation are considered
                </p>
                <p>improperly maintained and will void the warranty.</p>
              </li>
              <li style={{ marginTop: "12px" }}>
                <strong>Appliance-Related Damage</strong>
                <p style={{ marginTop: "12px" }}>
                  Damage caused by heat, steam, water, or other conditions related to
                  appliance use is
                </p>
                <p>considered improper care and will void the warranty.</p>
              </li>
            </ul>
            <div
              style={{
                marginTop: "12px",
                borderBottom: "2px solid rgba(255, 255, 255, 0.3)",
                paddingBottom: "12px",
                marginBottom: "12px",
              }}
            ></div>
          </Collapsible>

          <Collapsible title="Product Warranty Exceptions">
            <ul className="sms-list">
              <li style={{ marginTop: "12px" }}>
                <strong>Electronic Components</strong>
                <p style={{ marginTop: "12px" }}>
                  Electronic components, including lighting systems and electronic
                  assist-opening devices, are
                </p>
                <p>
                  covered by the implied limited warranty of the original supplier.
                </p>
              </li>
              <li style={{ marginTop: "12px" }}>
                <strong>Specialty Finishes</strong>
                <p style={{ marginTop: "12px" }}>
                  Certain specialty finishes may have limited coverage or exclusions.
                  If applicable, your designer
                </p>
                <p>will be provided with a disclaimer. </p>
              </li>
              <li style={{ marginTop: "12px" }}>
                <strong>Specialty Products</strong>
                <p style={{ marginTop: "12px" }}>
                  Some outsourced specialty products and oversized items may not be
                  covered under any implied
                </p>
                <p>warranty.</p>
              </li>
            </ul>
          </Collapsible>
        </div>
      </div>
      <div style={{ height: "2vh" }}></div>
    </div>
  );
};

export default CabinetCare;
