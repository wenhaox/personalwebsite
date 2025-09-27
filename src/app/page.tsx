export default function Home() {
  return (
    <div className="flex items-start justify-start min-h-screen px-6 md:px-16 lg:px-32 pt-20 lg:pt-0" style={{'--lg-padding-top': 'calc(20vh - 12px)'} as any}>
      <div className="max-w-2xl space-y-6">
        <h1 className="text-4xl md:text-5xl font-serif italic leading-tight">
          Hey! It&apos;s Saturday and I&apos;m Your Name.
        </h1>
        
        <div className="space-y-4 text-lg leading-relaxed">
          <p>
            I&apos;m currently building something meaningful, focusing on creating 
            spaces and experiences that bring people together.
          </p>
          
          <p>
            I spend a lot of time <em className="italic underline decoration-accent">writing</em> - mostly about my building journey, 
            human agency, and ways to live better.
          </p>
          
          <p>
            I also spend a lot of time moving - whether it&apos;s lifting, taking long 
            walks in nature, playing sports, or dancing.
          </p>
          
          <p>
            I live for beautiful spaces, walkable cities, good writing, 
            nourishing food, reggaeton, coffee, potlucks, electric 
            conversations, the sun, and dancing!
          </p>
          
          <p>
            I&apos;d describe most of my friends as social technologists. They&apos;re 
            thoughtful, curious, benevolent, charming, have a bias for action, 
            and they care about people. If that sounds like you, or if you 
            resonate with anything on my website, please <span className="underline decoration-accent cursor-pointer">reach out</span> :)
          </p>
        </div>

      </div>
    </div>
  );
}
