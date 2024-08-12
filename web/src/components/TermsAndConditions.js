import React from "react";
import { Card} from "@nextui-org/react";

const TermsAndConditions = () => {

  return (
    <div className="flex flex-col items-center p-4 min-h-screen bg-gray-100 dark:bg-gray-900">
      <Card className="w-full max-w-3xl p-6 bg-white dark:bg-gray-800 shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            Terms and Conditions
          </h2>
        </div>
        <div className="text-gray-700 dark:text-gray-300 space-y-6">
          <section>
            <h3 className="text-xl font-semibold">Introduction</h3>
            <p>
              Welcome to <strong>Chat-with-LLMs</strong>. By accessing or using
              our website, you agree to comply with and be bound by these Terms
              and Conditions. If you do not agree with these terms, you should
              not use our website.
            </p>
          </section>

          <section>
            <h3 className="text-xl font-semibold">Accounts and Registration</h3>
            <p>
              To access the features of <strong>Chat-with-LLMs</strong>, you
              must create an account using your Google credentials. By
              registering, you agree to provide accurate and complete
              information. We store your name, email, Google ID, profile
              picture, and chat history. You are responsible for maintaining the
              confidentiality of your account credentials and for all activities
              that occur under your account.
            </p>
          </section>

          <section>
            <h3 className="text-xl font-semibold">Pricing and Payment</h3>
            <p>
              Our services are offered through different subscription plans:
            </p>
            <ul className="list-disc ml-5">
              <li>Basic: ₹420 for 50 Generations on all models</li>
              <li>Standard: ₹840 for 250 Generations on all models</li>
              <li>Premium: ₹1680 for 500 Generations on all models</li>
            </ul>
            <p>
              Payments are processed securely through Razorpay. All fees are
              non-refundable except as required by law.
            </p>
          </section>

          <section>
            <h3 className="text-xl font-semibold">User Responsibilities</h3>
            <p>
              You agree to use our services for lawful purposes only. You are
              prohibited from:
            </p>
            <ul className="list-disc ml-5">
              <li>Advertising or offering to sell goods or services.</li>
              <li>Selling or transferring your account to another person.</li>
              <li>
                Engaging in any activity that disrupts or interferes with the
                functionality of the website.
              </li>
            </ul>
          </section>

          <section>
            <h3 className="text-xl font-semibold">Privacy Policy</h3>
            <p>
              We are committed to protecting your privacy. Please refer to our
              Privacy Policy for information on how we collect, use, and
              disclose your personal data.
            </p>
          </section>

          <section>
            <h3 className="text-xl font-semibold">Dispute Resolution</h3>
            <p>
              Any disputes arising from your use of our services will first be
              resolved through informal negotiations. If these negotiations
              fail, disputes will be resolved by arbitration as per the rules of
              the relevant jurisdiction.
            </p>
          </section>

          <section>
            <h3 className="text-xl font-semibold">Termination</h3>
            <p>
              We reserve the right to suspend or terminate your access to{" "}
              <strong>Chat-with-LLMs</strong> at our sole discretion, without
              notice, if you violate any of these terms.
            </p>
          </section>

          <section>
            <h3 className="text-xl font-semibold">Modifications to Terms</h3>
            <p>
              We may modify these Terms and Conditions at any time. Any changes
              will be posted on our website, and your continued use of the
              service constitutes acceptance of the updated terms.
            </p>
          </section>

          <section>
            <h3 className="text-xl font-semibold">Contact Information</h3>
            <p>
              If you have any questions about these Terms and Conditions, please
              contact us at support@chat-with-llms.com .
            </p>
          </section>
        </div>
      </Card>
    </div>
  );
};

export default TermsAndConditions;