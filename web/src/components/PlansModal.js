import React, { useEffect, useState } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Spinner } from "@nextui-org/react";
import axios from "axios";

export const PlansModal = ({ isOpen, onClose }) => {
  const API_HOST = process.env.REACT_APP_API_HOST || "http://localhost:5000";
  const accessToken = localStorage.getItem("accessToken");

  const [plans, setPlans] = useState();
  const [loading, setLoading] = useState(false);

  const createSubscription = async () => {
    setLoading(true);
    try {
      const redirectUrl = window.location.href;

      const response = await axios.post(
        `${API_HOST}/v1/subscriptions`,
        {
          "redirect_url": redirectUrl,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      
      if (response.data && response.data.short_url) {
        // Open the payment URL in a popup
        const paymentPopup = window.open(
          response.data.short_url,
          'RazorpayPayment',
          'width=600,height=600,resizable=yes,scrollbars=yes,status=yes'
        );

        // Check if popup was blocked by the browser
        if (!paymentPopup || paymentPopup.closed || typeof paymentPopup.closed == 'undefined') {
          alert("Popup blocked. Please allow popups for this site to proceed with the payment.");
        }

        // Listen for messages from the popup
        window.addEventListener('message', handlePaymentMessage, false);
      } else {
        console.error('No payment URL received');
      }
    } catch (error) {
      console.error('Error creating subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentMessage = (event) => {
    // Verify the origin of the message
    if (event.origin !== window.location.origin) return;

    if (event.data.paymentStatus === 'success') {
      // Handle successful payment
      console.log('Payment successful');
      onClose(); // Close the modal
      // You might want to update the user's subscription status here
    } else if (event.data.paymentStatus === 'failure') {
      // Handle payment failure
      console.log('Payment failed');
    }

    // Remove the event listener
    window.removeEventListener('message', handlePaymentMessage);
  };

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await axios.get(`${API_HOST}/v1/plans`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        setPlans(response.data);
      } catch (error) {
        console.error('Error fetching plans:', error);
      }
    };

    fetchPlans();
  }, [API_HOST, accessToken]);

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
              <span className="text-xl font-bold text-green-500">₹ {plans?.amount}</span>
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
          <Button 
            className={`dark:bg-green-600 dark:hover:bg-green-700 bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded`} 
            onClick={createSubscription}
            disabled={loading}
          >
            {loading ? (
              <>
                <Spinner size="sm" color="white" />
                <span className="ml-2">Processing...</span>
              </>
            ) : (
              'Subscribe Now'
            )}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};