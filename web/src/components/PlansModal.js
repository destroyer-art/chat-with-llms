import React, { useEffect, useState } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Spinner } from "@nextui-org/react";
import axios from "axios";
import congratulations from "../images/congratulations.gif";

export const PlansModal = ({ isOpen, onClose }) => {
  const API_HOST = process.env.REACT_APP_API_HOST || "http://localhost:5000";
  const accessToken = localStorage.getItem("accessToken");

  const [plans, setPlans] = useState();
  const [loading, setLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null);

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
        const paymentPopup = window.open(
          response.data.short_url,
          'RazorpayPayment',
          'width=600,height=600,resizable=yes,scrollbars=yes,status=yes'
        );

        if (!paymentPopup || paymentPopup.closed || typeof paymentPopup.closed == 'undefined') {
          alert("Popup blocked. Please allow popups for this site to proceed with the payment.");
          setLoading(false);
        } else {
          // Check if the popup is closed every second
          const checkPopupClosed = setInterval(() => {
            if (paymentPopup.closed) {
              clearInterval(checkPopupClosed);
              handlePopupClosed();
            }
          }, 1000);
        }
      } else {
        console.error('No payment URL received');
        setLoading(false);
      }
    } catch (error) {
      console.error('Error creating subscription:', error);
      setLoading(false);
    }
  };

  const checkSubscriptionStatus = async () => {
    try {
      // fetch the latest subscription 
      const response = await axios.get(
        `${API_HOST}/v1/fetch_subscription`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      // if response is 200, then get the top level key of the response
      if (response.status === 200 && response.data.length > 0) {
        const subscriptionId = response.data[0].subscription_id;
        // check the subscription status
        const subscriptionStatus = await axios.get(
          `${API_HOST}/v1/subscriptions/${subscriptionId}/status`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );
        console.log('Subscription status:', subscriptionStatus.data);
        // if the subscription status is active, then set the payment status to success
        if (subscriptionStatus?.data?.status === 'active') {
          return true;
        } else {
          return false;
        }
      }
    }
    catch (error) {
      console.error('Error fetching subscription:', error);
    }
  }

  const handlePopupClosed = async () => {
    try {
      const subscriptionStatus = await checkSubscriptionStatus();
      if (subscriptionStatus) {
        setPaymentStatus('success');
      } else {
        setPaymentStatus('failed');
      }
      setLoading(false);
    } catch (error) {
      console.error('Error handling popup closed:', error);
      setLoading(false);
    } finally {
      setLoading(false);
    }
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

    checkSubscriptionStatus().then((status) => {
      if (status) {
        setPaymentStatus('success');
      } else {
        fetchPlans();
      }
    });
    
  }, [API_HOST, accessToken]);

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalContent className={`bg-white dark:bg-gray-900 dark:text-white rounded-lg shadow-lg p-6`}>
        <ModalHeader>
          <h2 className={`text-2xl font-bold dark:text-white text-gray-800`}>Plus Subscription</h2>
        </ModalHeader>
        <ModalBody> 
          {paymentStatus === 'success' ? (
            <div className="flex flex-col items-center space-y-4">
              <img src={congratulations} alt="Congratulations" className="w-200 h-200" />
              <p className="text-center text-green-500 font-semibold">
                Congratulations! You can now enjoy the Plus subscription and its benefits.
              </p>
              <p className="text-center text-gray-600">
                Explore advanced features and powerful AI models at your fingertips.
              </p>
            </div>
          ) : (
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
          )}
        </ModalBody>
        <ModalFooter>
          {paymentStatus === 'success' ? (
            <Button
              className={`bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded`}
              onClick={onClose}
            >
              Close
            </Button>
          ) : (
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
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};