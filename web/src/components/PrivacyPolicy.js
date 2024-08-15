import React from "react";
import { Card } from "@nextui-org/react";

const PrivacyPolicy = () => {

  return (
    <div className="flex flex-col items-center p-4 min-h-screen bg-gray-100 dark:bg-gray-900">
      <Card className="w-full max-w-3xl p-6 bg-white dark:bg-gray-800 shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            Privacy Policy
          </h2>
          
        </div>
        <div className="text-gray-700 dark:text-gray-300 space-y-6">
          <section>
            <h3 className="text-xl font-semibold">Introduction</h3>
            <p>
              Welcome to <strong>Chat-with-LLMs</strong>. This Privacy Policy
              explains how we collect, use, disclose, and safeguard your
              information when you visit our website. By using our website, you
              consent to the data practices described in this policy.
            </p>
          </section>

          <section>
            <h3 className="text-xl font-semibold">Information We Collect</h3>
            <p>
              We collect information directly from you when you create an
              account, such as:
            </p>
            <ul className="list-disc ml-5">
              <li>Name</li>
              <li>Email Address</li>
              <li>Google ID</li>
              <li>Profile Picture</li>
              <li>Chat History</li>
            </ul>
            <p>
              This information is essential to provide you with our services and
              enhance your user experience.
            </p>
          </section>

          <section>
            <h3 className="text-xl font-semibold">How We Use Your Information</h3>
            <p>
              We use the information we collect to:
            </p>
            <ul className="list-disc ml-5">
              <li>Provide and manage your access to our website</li>
              <li>Process your transactions</li>
              <li>Enhance your user experience</li>
              <li>Understand how you use our services</li>
              <li>Communicate with you regarding updates or issues</li>
            </ul>
          </section>

          <section>
            <h3 className="text-xl font-semibold">Sharing Your Information</h3>
            <p>
              We do not sell or trade your personal information. However, we may
              share your data with third-party service providers for:
            </p>
            <ul className="list-disc ml-5">
              <li>Payment processing (e.g., Razorpay)</li>
              <li>Authentication (e.g., Google Login)</li>
              <li>Analytics and usage data tracking</li>
            </ul>
            <p>
              These providers are obligated to keep your information secure and
              use it only for the services they provide to us.
            </p>
          </section>

          <section>
            <h3 className="text-xl font-semibold">Security</h3>
            <p>
              We implement various security measures to protect your personal
              information. However, please be aware that no method of
              transmission over the internet or method of electronic storage is
              100% secure.
            </p>
          </section>

          <section>
            <h3 className="text-xl font-semibold">Your Rights</h3>
            <p>
              You have the right to access, correct, or delete the personal
              information we hold about you. If you wish to exercise these
              rights, please contact us at support@chat-with-llms.com .
            </p>
          </section>

          <section>
            <h3 className="text-xl font-semibold">Changes to This Policy</h3>
            <p>
              We may update this Privacy Policy from time to time. Any changes
              will be posted on this page, and your continued use of the website
              constitutes acceptance of the updated terms.
            </p>
          </section>

          <section>
            <h3 className="text-xl font-semibold">Contact Us</h3>
            <p>
              If you have any questions about this Privacy Policy, please
              contact us at support@chat-with-llms.com
            </p>
          </section>
        </div>
      </Card>
    </div>
  );
};

export default PrivacyPolicy;
