import React from "react";
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';

import SignUpForm from "../components/forms/SignUpForm";
import PublicHeader from "../components/headers/PublicHeader";

export default function SignUp() {
  return (
    <div className="bg-gray-50 ">
      <div>
        <PublicHeader />
      </div>
      <div className="flex flex-col items-center justify-center px-6 mx-auto md:h-screen lg:py-0">
        <div className="mb-4 w-full bg-white rounded-lg shadow md:mt-0 sm:max-w-md xl:p-0">
          <div className="p-6 space-y-4 md:space-y-6 sm:p-8">
            <h1 className="text-xl text-center font-bold leading-tight tracking-tight text-gray-900 md:text-2xl">
              Sign Up
            </h1>
            <SignUpForm />
          </div>
        </div>
      </div>
    </div>
  );
}
