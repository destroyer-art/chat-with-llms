import React from "react";
import { Card, Spacer } from "@nextui-org/react";

const ContactUs = () => {
  return (
    <div className="flex flex-col items-center p-4 min-h-screen bg-gray-100 dark:bg-gray-900">
      <Card className="w-full max-w-3xl p-6 bg-white dark:bg-gray-800 shadow-lg">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 text-center">
            Contact Us
          </h2>
        </div>
        <div className="text-gray-700 dark:text-gray-300 space-y-6">
          <section>
            <h3 className="text-xl font-semibold">Email Us</h3>
            <p>
              For any inquiries, support requests, or feedback, please feel free to reach out to us via email at:
            </p>
            <p className="text-lg font-medium">
              <a href="mailto:support@chat-with-llms.com" className="text-blue-500 dark:text-blue-300">
                support@chat-with-llms.com
              </a>
            </p>
          </section>

          <section>
            <h3 className="text-xl font-semibold">Office Locations</h3>
            <Spacer y={5} />
            <p className="text-md">
              Vibgyor High School Road, <br />
              Near Kundalahalli Gate, <br />
              Whitefield, <br />
              Bengaluru - 560066, <br />
              Karnataka, India.
            </p>
          </section>
        </div>
      </Card>
    </div>
  );
};

export default ContactUs;
