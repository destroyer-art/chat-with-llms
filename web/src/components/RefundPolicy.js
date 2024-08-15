import React from "react";
import { Card } from "@nextui-org/react";

const RefundPolicy = () => {
  return (
    <div className="flex flex-col items-center p-4 min-h-screen bg-gray-100 dark:bg-gray-900">
      <Card className="w-full max-w-3xl p-6 bg-white dark:bg-gray-800 shadow-lg">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 text-center">
            Refund Policy
          </h2>
        </div>
        <div className="text-gray-700 dark:text-gray-300 space-y-6">
          <section>
            <p>
              At <strong>Chat-with-LLMs</strong>, we strive to ensure that our customers have a seamless experience. 
              Since our product involves the purchase of generation credits for immediate use, we generally do not offer 
              refunds or cancellations after a purchase is completed. However, refunds may be granted under the following circumstances:
            </p>
          </section>

          <section>
            <h3 className="text-xl font-semibold">Refund Eligibility</h3>
            <ul className="list-disc ml-5">
              <li>
                If you were charged incorrectly due to a technical error or billing issue, please contact us 
                within 5 days of the transaction. We will investigate the issue, and if confirmed, either the 
                appropriate number of generations will be added to your account, or a refund will be processed.
              </li>
              <li>
                If the purchased generation credits were not added to your account due to a technical issue, 
                and we are unable to resolve the problem within a reasonable timeframe, you may request a refund. 
              </li>
            </ul>
          </section>

          <section>
            <h3 className="text-xl font-semibold">Processing Time</h3>
            <p>
              Refunds, if applicable, will be processed within 5-7 working days and credited back to your 
              original method of payment. Please note that the time it takes for the refund to reflect in your account 
              may vary depending on your payment provider.
            </p>
          </section>

          <section>
            <h3 className="text-xl font-semibold">How to Request a Refund</h3>
            <p>
              To request a refund, please contact us via email at <a href="mailto:support@chat-with-llms.com" className="text-blue-500 dark:text-blue-300">support@chat-with-llms.com</a>. 
              Include your order details and a description of the issue you encountered. Our team will review your request and get back to you within 48 hours.
            </p>
          </section>
        </div>
      </Card>
    </div>
  );
};

export default RefundPolicy;
