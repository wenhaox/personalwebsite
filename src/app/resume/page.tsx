export default function Resume() {
  return (
    <div className="flex items-start justify-start min-h-screen px-32 py-16 mobile-main-content">
      <div className="max-w-4xl mx-auto">
        <section>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-serif italic leading-tight mb-6 mobile-hide-title">Resume</h1>
            <p className="text-sm text-muted leading-relaxed">
              A snapshot of my journey, skills, and experiences that have shaped who I am today.
            </p>
          </div>

          {/* Experience */}
          <div className="grid md:grid-cols-1 gap-8 pt-8">
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-serif mb-4">Experience</h2>
                <div className="space-y-6">
                  <div className="border-l-2 border-accent pl-6">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-xl font-medium">Current Role</h3>
                      <span className="text-sm text-muted">2024 - Present</span>
                    </div>
                    <p className="text-accent mb-2">Building Something Meaningful</p>
                    <p className="text-muted">
                      Currently focused on creating spaces and experiences that bring people together, 
                      with an emphasis on human agency and meaningful connections.
                    </p>
                  </div>

                  <div className="border-l-2 border-muted pl-6">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-xl font-medium">Previous Experience</h3>
                      <span className="text-sm text-muted">2020 - 2024</span>
                    </div>
                    <p className="text-accent mb-2">Various Roles & Projects</p>
                    <p className="text-muted">
                      Developed skills in photography, writing, and community building while 
                      exploring different ways to create positive impact.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-serif mb-4">Skills & Interests</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-medium mb-3">Creative</h3>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-3 py-1 text-sm bg-accent/10 text-accent rounded-full">Photography</span>
                      <span className="px-3 py-1 text-sm bg-accent/10 text-accent rounded-full">Writing</span>
                      <span className="px-3 py-1 text-sm bg-accent/10 text-accent rounded-full">Visual Design</span>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-3">Technical</h3>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-3 py-1 text-sm bg-accent/10 text-accent rounded-full">Web Development</span>
                      <span className="px-3 py-1 text-sm bg-accent/10 text-accent rounded-full">Project Management</span>
                      <span className="px-3 py-1 text-sm bg-accent/10 text-accent rounded-full">Community Building</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Download Resume */}
          <div className="pt-10 border-t border-border">
            <h2 className="text-2xl font-serif mb-4">Download Resume</h2>
            <p className="text-muted mb-6">
              For a more detailed overview of my experience and qualifications.
            </p>
            <a 
              href="/resume.pdf"
              className="inline-flex items-center space-x-2 px-6 py-3 bg-accent text-stone-100 hover:bg-accent-light transition-colors rounded-lg shadow-sm"
            >
              <span>Download PDF</span>
              <span>↓</span>
            </a>
          </div>
        </div>
        </section>
      </div>
    </div>
  )
}
