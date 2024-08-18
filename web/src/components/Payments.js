import React, { useEffect, useState } from 'react'
import loading from '../images/loading.webp';
import { Accordion, AccordionItem } from "@nextui-org/react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Chip } from "@nextui-org/react";

export const Payments = ({ isOpen, onClose }) => {
  const [paymentLoading, setPaymentLoading] = useState(true);
  const [paymentDetailsLoading, setPaymentDetailsLoading] = useState(false);
  const [payments, setPayments] = useState([]);
  const API_HOST = process.env.REACT_APP_API_HOST || "http://localhost:5000";
  const accessToken = localStorage.getItem("accessToken");
  const [paymentDetails, setPaymentDetails] = useState(null);

  const getUserPayments = async () => {
    try {
        const response = await fetch(`${API_HOST}/v1/fetch_payments`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        const data = await response.json();
        if (data.status === 403) {
            // create an alert that payments section is coming soon
            alert("Payments Gateway is coming soon");
            return;
        }
        setPaymentLoading(false);

        // convert timestamp to human readable date and time
        data.forEach((payment) => {
            payment.created_at = new Date(payment.created_at).toLocaleString();
        });

        setPayments(data);
        
    } catch(err) {
        console.error(err);
        setPaymentLoading(false);
    }
  }

  const getPaymentDetails = async (paymentId) => {
    try {
        setPaymentDetailsLoading(true);
        setPaymentDetails(null);
        const response = await fetch(`${API_HOST}/v1/fetch_payment/${paymentId}`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        const data = await response.json();
        setPaymentDetailsLoading(false);
        setPaymentDetails(data);
    } catch(err) {
        setPaymentDetailsLoading(false);
        console.error(err);
    }
  }

  useEffect(() => {
    getUserPayments();
  }, []);

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      size="5xl"
      className="bg-white dark:bg-gray-900"
      scrollBehavior="inside"
    >
      <ModalContent className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg shadow-lg">
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col items-center border-b border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-2">Payments</h2>
            </ModalHeader>
            <ModalBody className="p-6 overflow-y-auto max-h-[calc(100vh-200px)]">
              {paymentLoading ? (
                <div className="flex justify-center items-center h-full">
                  <img src={loading} alt="Loading" className="w-16 h-16" />
                </div>
              ) : (
                <Accordion variant="splitted" >
                  {payments.map((payment) => (
                    <AccordionItem key={payment.payment_id} aria-label={`Payment on ${payment.created_at}`} title={`Payment on ${payment.created_at}`} onPress={
                        (e) => {
                            const isOpen = e.target.getAttribute('data-open');
                            if (isOpen === 'true') {
                                getPaymentDetails(payment.payment_id);
                            }
                        }
                    }>
                      {paymentDetailsLoading ? (
                        <div className="flex justify-center items-center h-full">
                          <img src={loading} alt="Loading" className="w-16 h-16" />
                        </div>
                      ) : (
                        <div className="p-4">
                          <p className="text-lg font-semibold">Payment ID: {paymentDetails?.id}</p>
                          <p className="text-lg font-semibold">Order ID: {paymentDetails?.order_id}</p>
                          <p className="text-lg font-semibold">Amount: {paymentDetails?.currency} {paymentDetails?.amount/100}</p>
                          <p className="text-lg font-semibold">Status: <Chip color={
                                paymentDetails?.status === "captured" ? "success" : "error"
                          }>{paymentDetails?.status}</Chip></p>
                          <p className="text-lg font-semibold">Plan: {paymentDetails?.description}</p>
                        </div>
                      )}
                    </AccordionItem>
                  ))}
                </Accordion>
              )}
            </ModalBody>
            <ModalFooter className="justify-center border-t border-gray-200 dark:border-gray-700 p-6">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition duration-300"
              >
                Close
              </button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  )
}