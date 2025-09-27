export default function Connect() {
  return (
    <div className="flex items-start justify-start min-h-screen px-32 py-16">
      <div className="w-full">
        <section>
        <div className="space-y-8">
          <div>
            <h1 className="text-4xl md:text-5xl font-serif italic leading-tight mb-6">Connect</h1>
            <p className="text-sm text-muted leading-relaxed">
              I&apos;m always excited to meet new people, collaborate on interesting projects, 
              or simply have a good conversation over coffee. Don&apos;t hesitate to reach out!
            </p>
          </div>

          {/* Contact Methods */}
          <div className="grid md:grid-cols-2 gap-8 pt-8 border-t border-border">
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-serif mb-4">Get in Touch</h2>
                <div className="space-y-4">
                  <a 
                    href="mailto:your.email@example.com"
                    className="flex items-center space-x-3 text-lg hover:text-accent transition-colors group"
                  >
                    <span className="text-accent font-bold">@</span>
                    <span className="group-hover:underline">your.email@example.com</span>
                  </a>
                  
                  <a 
                    href="https://twitter.com/yourusername"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-3 text-lg hover:text-accent transition-colors group"
                  >
                    <span className="text-accent font-bold">T</span>
                    <span className="group-hover:underline">Twitter</span>
                  </a>
                  
                  <a 
                    href="https://instagram.com/yourusername"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-3 text-lg hover:text-accent transition-colors group"
                  >
                    <span className="text-accent font-bold">I</span>
                    <span className="group-hover:underline">Instagram</span>
                  </a>
                  
                  <a 
                    href="https://linkedin.com/in/yourusername"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-3 text-lg hover:text-accent transition-colors group"
                  >
                    <span className="text-accent font-bold">L</span>
                    <span className="group-hover:underline">LinkedIn</span>
                  </a>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-serif mb-3">What I&apos;m Looking For</h3>
                <ul className="space-y-2 text-muted">
                  <li>• Creative collaborations</li>
                  <li>• Photography projects</li>
                  <li>• Interesting conversations</li>
                  <li>• Coffee meetups in SF</li>
                  <li>• Speaking opportunities</li>
                </ul>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-serif mb-4">Current Status</h2>
                <div className="space-y-4">
                  <div className="p-4 bg-card border border-border rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="font-medium">Available for new projects</span>
                    </div>
                    <p className="text-sm text-muted">
                      Currently accepting freelance photography work and creative collaborations.
                    </p>
                  </div>
                  
                  <div className="p-4 bg-card border border-border rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="w-3 h-3 bg-accent rounded-full"></div>
                      <span className="font-medium">Based in San Francisco</span>
                    </div>
                    <p className="text-sm text-muted">
                      Happy to meet for coffee or explore the city together.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-serif mb-3">Response Time</h3>
                <p className="text-muted">
                  I typically respond to emails within 24-48 hours. For urgent matters, 
                  feel free to reach out on social media for a quicker response.
                </p>
              </div>
            </div>
          </div>

          {/* Call to Action */}
          <div className="pt-10 border-t border-border">
            <h2 className="text-2xl font-serif mb-4">Let&apos;s Create Something Together</h2>
            <p className="text-muted mb-6">
              Whether you have a specific project in mind or just want to connect, 
              I&apos;d love to hear from you. Every great collaboration starts with a conversation.
            </p>
            <a 
              href="mailto:your.email@example.com"
              className="inline-flex items-center space-x-2 px-6 py-3 bg-accent text-stone-100 hover:bg-accent-light transition-colors rounded-lg shadow-sm"
            >
              <span>Send me an email</span>
              <span>→</span>
            </a>
          </div>
        </div>
        </section>
      </div>
    </div>
  )
}