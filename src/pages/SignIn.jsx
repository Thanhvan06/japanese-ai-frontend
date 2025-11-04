import React, { useState } from "react";
import { Link } from "react-router-dom";

const SignIn = () => {
  const [isSignUp, setIsSignUp] = useState(false);

  return (
    <div className="relative h-screen w-full overflow-hidden bg-[#77BEF0] flex items-center justify-center">
      {/* --- Cloud layers --- */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="clouds cloud1"></div>
        <div className="clouds cloud2"></div>
        <div className="clouds cloud3"></div>
      </div>

      {/* --- Auth Card --- */}
      <div className="relative z-10 bg-white bg-opacity-90 rounded-2xl shadow-xl p-8 w-[350px] text-center animate-fadeIn">
        <h1 className="text-2xl font-bold mb-4 text-[#77BEF0]">
          {isSignUp ? "Sign Up" : "Sign In"}
        </h1>

        <form className="flex flex-col gap-4">
          {isSignUp && (
            <input
              type="text"
              placeholder="Name"
              className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-[#77BEF0]"
            />
          )}
          <input
            type="email"
            placeholder="Email"
            className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-[#77BEF0]"
          />
          <input
            type="password"
            placeholder="Password"
            className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-[#77BEF0]"
          />

          <button
            type="submit"
            className="bg-[#77BEF0] hover:bg-[#4a9ed3] text-white font-semibold py-2 rounded-md transition-all duration-200"
          >
            {isSignUp ? "Sign Up" : "Sign In"}
          </button>
        </form>

        <p className="mt-4 text-sm">
          {isSignUp ? "Already have an account?" : "Don’t have an account?"}{" "}
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-[#77BEF0] hover:underline"
          >
            {isSignUp ? "Sign In" : "Sign Up"}
          </button>
        </p>
      </div>
    </div>
  );
};

export default SignIn;
