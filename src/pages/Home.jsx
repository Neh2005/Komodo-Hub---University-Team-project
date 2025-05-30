import Hero from "../components/Homeimage";

/* ***** Dhanya's part ***** */
const Home = () => {
  return (
    <main>
      <Hero />
      {/* About Section */}
      <section id="about">
        <h2 className='text-center'>About Us</h2>
        <p>
          Komodo Hub is a revolutionary digital platform designed to empower
          schools, communities, and individuals in the conservation of
          endangered species. Our platform integrates education, gamification,
          and community-driven initiatives to raise awareness and encourage
          active participation in conservation efforts. By combining
          interactive learning experiences with real-world conservation
          activities, Komodo Hub bridges the gap between education and action,
          ensuring a sustainable future for our planet’s most vulnerable
          species.
        </p>

        <div className="about-cards">
          <div className="card">
            <h3>Vision</h3>
            <p>
              To create a globally connected platform where students,
              educators, and conservationists collaborate to protect endangered
              species through education, engagement, and innovation.
            </p>
          </div>
          <div className="card">
            <h3>Mission</h3>
            <ul>
              <li>
                <strong>Empower Schools</strong> – Provide educators with
                engaging digital tools to integrate conservation topics into
                their curriculum.
              </li>
              <li>
                <strong>Support Communities</strong> – Enable local
                conservation groups to share knowledge, contribute data, and
                participate in real-world conservation efforts.
              </li>
              <li>
                <strong>Engage Individuals</strong> – Offer interactive learning
                experiences, challenges, and gamified activities that inspire
                people to take action for wildlife conservation.
              </li>
              <li>
                <strong>Ensure Sustainability</strong> – Promote long-term
                conservation efforts through innovative technology,
                partnerships, and community-driven initiatives.
              </li>
            </ul>
          </div>
        </div>
      </section>

    

      {/* Partners Section */}
      <section id="partners">
        <h2>Our Partners</h2>
        <p>
          At Komodo Hub, we believe in the power of collaboration. Our
          partnerships with schools and communities allow us to create a lasting
          impact through education and conservation initiatives.
        </p>

        <div className="partner-container">
          {/* Schools */}
          <div className="partner-box">
            <img src="images/school.jpg" alt="Schools Partnership" />
            <div className="partner-text">
              <h3>150+ Schools Registered</h3>
              <p>
                We work with a growing network of schools, helping students learn
                about conservation through interactive and gamified educational
                experiences.
              </p>
            </div>
          </div>

          {/* Community */}
          <div className="partner-box">
            <img src="images/community.jpg" alt="Community Engagement" />
            <div className="partner-text">
              <h3>50+ Communities Engaged</h3>
              <p>
                By partnering with local communities, we ensure that conservation
                efforts go beyond classrooms, fostering real-world change and
                awareness.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* **** TILL HERE DHANYA'S PART **** */}

      {/* Games Section - **** This entire section is CHALITHA'S PART **** */}
      <section id="games">
        <h2>Our Games</h2>
        <p>Explore our interactive learning games designed to educate and entertain!</p>

        <div className="game-container">
          <div className="game-box">
            <a href="https://www.sheppardsoftware.com/puzzles/endangered-animals/" target="_blank" rel="noopener noreferrer">
            <img src="https://sciencetrek.org/uploads/assets/game/Endangered-Species/_350xAUTO_fit_center-center_none/endangeredspecies_games_Endangered-Animals-Jigsaws.jpg" alt="Game1" /></a>
            <h3>Endangered Animals Jigsaws</h3>
            <p>Improve your problem solving skills with fun and interactive challenges.</p>
          </div>

          <div className="game-box">
            <a href="https://sdzwildlifeexplorers.org/activities/word-safari-endangered-species" target="_blank" rel="noopener noreferrer">
            <img src="https://sciencetrek.org/uploads/assets/game/Endangered-Species/_350xAUTO_fit_center-center_none/Endangered-Species_game_Word-Safari.png" alt="Game2" /></a>
            <h3>Word Safari - Endangered Species</h3>
            <p>
              Explore the world of Endangered Species through endangered species word search.
            </p>
          </div>

          <div className="game-box">
            <a href="https://pbskids.org/wildkratts/games/world-rescue" target="_blank" rel="noopener noreferrer">
            <img src="https://sciencetrek.org/uploads/assets/game/Endangered-Species/_350xAUTO_fit_center-center_none/Endangered-Species_game_World-Rescue.png" alt="Game3" /></a>
            <h3>Wild Kratts: World Rescue</h3>
            <p>
              Help save the animals from being endangered.
            </p>
          </div>
        </div>
      </section> 
      {/* ****** TIll Here CHALITHA's PART ************* */}

      {/* Pricing Section - ****Dhanya's part**** */}
      <section className="pricing-section">
        <div className="container">
          <div className="row justify-content-center">
            {/* Section Title */}
            <div className="col-12 text-center">
              <h2 className="pricing-title">Features</h2>
              <p className="pricing-text">Explore our amazing features designed for modern education.</p>
            </div>

            {/* Basic Plan */}
            <div className="col-12 col-md-4">
              <div className="pricing-card">
                <h3 className="pricing-card-title">Basic Access</h3>
                <p className="pricing-card-price">£5/month</p>
                <p className="pricing-card-desc">per month</p>
                <ul className="pricing-card-list">
                  <li>Essential features included</li>
                  <li>All features unlocked</li>
                  <li>Custom solutions available</li>
                  <li>Best for large schools</li>
                </ul>
                <a href="#login" className="btn btn-primary">Choose Your Plan!</a>
              </div>
            </div>

            {/* Premium Plan */}
            <div className="col-12 col-md-4">
              <div className="pricing-card best-value">
                <div className="best-badge">Best Value</div>
                <h3 className="pricing-card-title">School Access</h3>
                <p className="pricing-card-price">£15/month</p>
                <p className="pricing-card-desc">per month</p>
                <ul className="pricing-card-list">
                  <li>Student access management</li>
                  <li>Progress tracking</li>
                  <li>Community engagement</li>
                  <li>Advanced analytics</li>
                </ul>
                <a href="#login" className="btn btn-primary">Choose Your Plan!</a>
              </div>
            </div>

            {/* Enterprise Plan */}
            <div className="col-12 col-md-4">
              <div className="pricing-card">
                <h3 className="pricing-card-title">Community Access</h3>
                <p className="pricing-card-price">£20/month</p>
                <p className="pricing-card-desc">per month</p>
                <ul className="pricing-card-list">
                  <li>Custom integrations</li>
                  <li>Dedicated support</li>
                  <li>Scalability options</li>
                  <li>Premium security</li>
                </ul>
                <a href="#login" className="btn btn-primary">Choose Your Plan!</a>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Reviews Section */}
      <section className="reviews">
        <h2>Join Millions Of Happy Users.</h2>
        <div className="review-container">
          <div className="review-card">
            <p>
              "Komodo Hub has transformed the way I engage my students with
              conservation education. The interactive learning tools make lessons
              more engaging, and the progress tracking helps me monitor student
              performance effortlessly. It’s an invaluable platform for our
              school!"
            </p>
            <hr />
            <div className="reviewer">
              <img src="images/monae.jpg" alt="Mona E." />
              <p>MONA.E</p>
            </div>
          </div>

          <div className="review-card">
            <p>
              "As a conservation volunteer, I love how Komodo Hub connects
              communities with real-world conservation projects. The ability to
              share reports and findings in a structured way has helped our local
              efforts tremendously. This platform makes participation accessible
              and impactful!"
            </p>
            <hr />
            <div className="reviewer">
              <img src="images/suzie.jpg" alt="Suzie R." />
              <p>SUZIE.R</p>
            </div>
          </div>

          <div className="review-card">
            <p>
              "Komodo Hub has made learning about endangered species fun and
              interactive! The gamified activities keep me engaged, and I enjoy
              earning badges for completing challenges. It's a great way to learn
              and contribute at the same time!"
            </p>
            <hr />
            <div className="reviewer">
              <img src="images/ellyn.jpg" alt="Ellyn W." />
              <p>ELLYN W.</p>
            </div>
          </div>
        </div>
      </section>
      {/* ***** TILL HERE DHANYA'S PART ***** */}

      {/*FAQs - **** REVAN's PART **** */}
      <section id="faq-section" className="content8 careerm5">
        <div className="container-fluid">
          <div className="row">
            <div className="col-12 col-lg-4">
              <div className="title-wrapper">
                <h3 className="mbr-section-title">Frequently Asked Questions</h3>
              </div>
            </div>
            <div className="col-12 col-lg-8">
              <div className="accordion" id="faqAccordion">
                {faqData.map((item, index) => (
                  <div className="card" key={index}>
                    <div className="card-header" id={`heading${index}`}>
                      <h4 className="panel-title">
                        <button
                          className="btn btn-link panel-title collapsed"
                          type="button"
                          data-bs-toggle="collapse"
                          data-bs-target={`#collapse${index}`}
                          aria-expanded="false"
                          aria-controls={`collapse${index}`}
                        >
                          {item.question}
                          <span className="mbr-iconfont mbr-iconfont-btn mobi-mbri-play mobi-mbri"></span>
                        </button>
                      </h4>
                    </div>
                    <div
                      id={`collapse${index}`}
                      className="collapse"
                      aria-labelledby={`heading${index}`}
                      data-bs-parent="#faqAccordion"
                    >
                      <div className="card-body">
                        <p className="panel-text">{item.answer}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

const faqData = [
  { question: "How secure is the login system?", answer: "Our system uses top-notch encryption to keep you safe!" },
  { question: "Can teachers see all students?", answer: "Nope! Teachers can only see their own class progress." },
  { question: "Is student work anonymous?", answer: "Absolutely! Non-school members won’t know who uploaded what." },
  { question: "What if I forget my password?", answer: "Just click 'Forgot Password' and follow the instructions!" },
  { question: "Can admins access everything?", answer: "Yes, admins have full access to all content." },
  { question: "How do I upload my work?", answer: "Simply go to the community section and follow the prompts!" },
];

{/* **** TILL HERE REVAN'S PART ***** */}

export default Home;
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
