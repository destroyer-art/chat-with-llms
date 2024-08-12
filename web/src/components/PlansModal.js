import React, { useState } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Card, CardHeader, CardBody, CardFooter } from "@nextui-org/react";

export const PlansModal = ({ isOpen, onClose }) => {
  const API_HOST = process.env.REACT_APP_API_HOST || "http://localhost:5000";
  const accessToken = localStorage.getItem("accessToken");

  const plans = [
    {
      name: 'Basic',
      description: '',
      price: 420,
      planId: "plan_50",
      features: [
        '50 Generations on all models',
      ],
    },
    {
      name: 'Standard',
      description: '',
      price: 840,
      planId: "plan_250",
      features: [
        '250 Generations on all models',
      ],
    },
    {
      name: 'Premium',
      description: '',
      price: 1680,
      planId: "plan_500",
      features: [
        '500 Generations on all models',
      ],
    },
  ];

  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false); // State to handle Razorpay modal

  const getOrderId = async (planId) => {
    try {
      const response = await fetch(`${API_HOST}/v1/create_order?plan_id=${planId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const data = await response.json();
      
      if (data.status === 403) {
        // create an alert that payments section is coming soon
        alert("Payments Gateway is coming soon");
        return;
      }

      onClose(); // Close the parent modal
      
      // Configure Razorpay options
      const options = {
        key: process.env.REACT_APP_RAZOR_PAY_KEY_ID,
        amount: data.amount,
        currency: data.currency,
        name: "Chat With LLMs",
        description: plans.find((plan) => plan.planId === planId).name,
        order_id: data.order_id,
        handler: function (response) {
          verfiyPayment(response); // Verify payment
          setIsPaymentOpen(false); // Close Razorpay modal
          alert("Payment successful");
          // make the page reload to update the user's plan
          window.location.reload();
        },
        prefill: {
          name: "John Doe",
          email: "johnDoe@xxx.com",
          contact: "9999999999",
        },
        theme : {
          color: "#3399cc",
        },
        modal: {
          ondismiss: function () {
            setIsPaymentOpen(false); // Handle closing of Razorpay modal
          }
        }
      };

      // Open Razorpay modal
      setIsPaymentOpen(true);
      const rzp = new window.Razorpay(options);
      rzp.open();
      
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const verfiyPayment = async (paymentRequest) => {
    try {
      const response = await fetch(`${API_HOST}/v1/verify_payment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(paymentRequest),
      });
      const data = await response.json();
    } catch (error) {
      console.error("Error:", error);
    }
  }

  return (
    <>
      <Modal 
        isOpen={isOpen && !isPaymentOpen} // Prevent opening this modal if Razorpay modal is open
        onClose={onClose}
        size="5xl"
        className="bg-white dark:bg-gray-900"
        scrollBehavior="inside"
      >
        <ModalContent className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg shadow-lg">
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col items-center border-b border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-2">Choose Your Plan</h2>
                <p className="text-gray-600 dark:text-gray-400 text-center">Select a plan that suits your needs</p>
              </ModalHeader>
              <ModalBody className="p-6 overflow-y-auto max-h-[calc(100vh-200px)]">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {plans.map((plan, index) => (
                    <Card
                      key={index}
                      isPressable
                      isHoverable
                      className={`w-full bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-xl transition-all duration-200 ${
                        selectedPlan === plan.name ? 'border-indigo-600' : ''
                      }`}
                      onClick={() => setSelectedPlan(plan.name)}
                    >
                      <CardHeader className="flex flex-col items-start p-6 pb-4">
                        <h3 className="text-xl font-semibold mb-1 text-gray-900 dark:text-white">{plan.name}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{plan.description}</p>
                      </CardHeader>
                      <CardBody className="px-6 py-4">
                        <div className="flex items-baseline mb-6">
                          <span className="text-5xl font-extrabold text-gray-900 dark:text-white">₹{plan.price}</span>
                          <span className="text-gray-600 dark:text-gray-400 ml-1">/-</span>
                        </div>
                        <ul className="space-y-3 text-sm">
                          {plan.features.map((feature, i) => (
                            <li key={i} className="flex items-start space-x-3">
                              <svg
                                className="flex-shrink-0 w-5 h-5 text-green-500 mt-0.5"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                  clipRule="evenodd"
                                ></path>
                              </svg>
                              <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </CardBody>
                      <CardFooter className="px-6 pt-4 pb-6">
                        <Button
                          className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg text-sm px-5 py-2.5 text-center w-full"
                          onClick={() => {
                            getOrderId(plan.planId);
                          }}
                        >
                          Get started
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </ModalBody>
              <ModalFooter className="justify-center border-t border-gray-200 dark:border-gray-700 p-6">
                <Button auto onClick={onClose} className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
                  Cancel
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
};
