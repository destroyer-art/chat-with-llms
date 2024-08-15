import React from 'react'
import { Link } from 'react-router-dom';


export const Footer = () => {
  return (
    <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
      <p className="text-xs text-gray-500 dark:text-gray-400">
        © 2024 chat-with-llms. All rights reserved.
      </p>
      <nav className="sm:ml-auto flex gap-4 sm:gap-6">
      <Link className="text-xs hover:underline underline-offset-4" to="/terms-and-conditions">
          Terms and Conditions
        </Link>
        <Link className="text-xs hover:underline underline-offset-4" to="/privacy">
          Privacy
        </Link>
        <Link className="text-xs hover:underline underline-offset-4" to="/refund-policy">
          Refund Policy
        </Link>
        <Link className="text-xs hover:underline underline-offset-4" to="/contact-us">
          Contact Us
        </Link>
        <a
          className="text-xs hover:underline underline-offset-4"
          href="https://github.com/Arghya721/chat-with-llms"
          target="_blank"
          rel="noopener noreferrer"
        >
          View on GitHub
        </a>
      </nav>
    </footer>
  )
}