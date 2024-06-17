import React from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button } from "@nextui-org/react";

export const PlansModal = ({ isOpen, onClose, dark }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalContent className={`bg-white dark:bg-gray-900 dark:text-white rounded-lg shadow-lg p-6`}>
        <ModalHeader>
          <h2 className={`text-2xl font-bold dark:text-white text-gray-800`}>Plus Subscription</h2>
        </ModalHeader>
        <ModalBody>
          <div className="flex flex-col space-y-4">
            <div className="flex items-center justify-between">
              <span className={`text-lg font-semibold dark:text-gray-300 text-gray-700`}>Price:</span>
              <span className="text-xl font-bold text-green-500">₹ 1650</span>
            </div>
            <div className="flex items-center space-x-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className={`dark:text-gray-300 text-gray-700`}>Early access to new features</span>
            </div>
            <div className="flex items-center space-x-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className={`dark:text-gray-300 text-gray-700`}>Access to powerful models like GPT-4, Claude-Opus, Gemini-1.5-Pro, and many more</span>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button className={`dark:bg-green-600 dark:hover:bg-green-700 bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded`} onClick={onClose}>
            Subscribe Now
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};