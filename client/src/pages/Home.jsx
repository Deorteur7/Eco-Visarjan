import { Link } from 'react-router';

const STEPS = [
  { title: 'Upload your idol', text: 'Add a photo and the height in feet. Gemini suggests clay or plaster of Paris, and you confirm.' },
  { title: 'Pick your option', text: 'Small clay idols can be immersed at home. Everything else is guided to a designated site.' },
  { title: 'Find the best site', text: 'Sites are ranked by distance, idol size, material, facility type and availability, not distance alone.' },
  { title: 'Navigate', text: 'See the route, distance and travel time, then open turn-by-turn directions on your phone.' },
  { title: 'Dispose of flowers properly', text: 'Find a flower and organic-waste drop-off instead of throwing offerings into a lake.' },
  { title: 'Track the impact', text: 'The dashboard shows what this app has guided, clearly separated from government figures.' },
];

export default function Home() {
  return (
    <div className="space-y-10">
      <section className="rounded-xl border border-line bg-white p-6 sm:p-10">
        <p className="text-sm font-semibold uppercase tracking-wide text-kumkum">Hyderabad, Ganesh Chaturthi</p>
        <h1 className="mt-2 max-w-3xl text-3xl text-ink sm:text-5xl">Celebrate Ganesh Chaturthi. Protect the water.</h1>
        <p className="mt-4 max-w-2xl text-lg text-muted">
          Idols made of plaster of Paris, along with paints, plastic and flowers, pollute the city&apos;s lakes.
          EcoVisarjan helps you choose a safer way to immerse your idol and to dispose of festival waste.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link to="/check" className="btn btn-primary text-base">
            Check My Idol
          </Link>
          <Link to="/map" className="btn btn-secondary text-base">
            Open the map
          </Link>
        </div>
      </section>

      <section aria-labelledby="how">
        <h2 id="how" className="text-2xl">How it works</h2>
        <ol className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {STEPS.map((step, index) => (
            <li key={step.title} className="card flex gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-saffron font-bold text-white">
                {index + 1}
              </span>
              <div>
                <h3 className="text-lg">{step.title}</h3>
                <p className="mt-1 text-sm text-muted">{step.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="honest" className="rounded-xl border border-turmeric/60 bg-turmeric-soft/50 p-5">
        <h2 id="honest" className="text-xl">Honest about our data</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
          <li>Immersion sites are labelled by source. Lakes named in press coverage have approximate map positions.</li>
          <li>Anything marked &quot;Demo placeholder&quot; is fictional and exists only to demonstrate the flow.</li>
          <li>The pollution estimate is a relative index from a model trained on synthetic data, not measured water quality.</li>
          <li>Impact figures are labelled &quot;Prototype / estimated impact&quot; and are never mixed with government statistics.</li>
        </ul>
      </section>
    </div>
  );
}
