export default function FooterTabs() {
    return (
      <div className="fixed bottom-4 left-4 flex items-end space-x-6 text-sm font-light text-gray-500 tracking-wide uppercase">
        <div className="flex flex-col space-y-1">
          <a href="#projects" className="hover:text-gray-900 transition">Projects</a>
          <a href="/resume.pdf" target="_blank" rel="noopener noreferrer" className="hover:text-gray-900 transition">Resume</a>
          <a href="https://github.com/codylejang" target="_blank" rel="noopener noreferrer" className="hover:text-gray-900 transition">Github</a>
          <a href="#contact" className="hover:text-gray-900 transition">Contact</a>
        </div>
        <p className="text-black font-normal">CODY LEJANG</p>
      </div>
    )
  }