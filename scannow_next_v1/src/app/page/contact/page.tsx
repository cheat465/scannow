"use client";
import React from "react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

const ContactPage = () => {
  return (
    <div className="min-h-screen bg-[#EFFFFF] flex flex-col font-sans">
      <Navbar />
      
      <main className="flex-grow flex flex-col items-center justify-start pt-20 px-4">
        <div className="w-full max-w-2xl">
          <h1 className="text-2xl font-bold text-black mb-4">@Help</h1>
          
          <div className="bg-[#61A9E5] rounded-xl p-8 shadow-md text-white">
            <p className="text-lg leading-relaxed font-medium">
              We’ve got answers to most questions in our Help Center.<br />
              If you can’t find what you’re looking for, feel free to reach out to us:<br />
              Email: hello@scannow.com
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ContactPage;
