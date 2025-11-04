import React from "react";
import { Link } from "react-router-dom";
import CloudBackground from "../components/CloudBackground";

const SignUp = () => {
  return (
    <CloudBackground>
      <form className="z-10 bg-white/90 p-8 rounded-xl shadow-xl flex flex-col gap-4 w-[320px] text-center animate-fadeIn">
        <h2 className="text-2xl font-bold text-gray-800">Sign Up</h2>
        <input
          type="text"
          placeholder="Name"
          className="p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-skyblue"
          required
        />
        <input
          type="email"
          placeholder="Email"
          className="p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-skyblue"
          required
        />
        <input
          type="password"
          placeholder="Password"
          className="p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-skyblue"
          required
        />
        <button
          type="submit"
          className="bg-skyblue hover:bg-[#5aa6db] text-white py-2 rounded-md font-medium transition-colors"
        >
          Create Account
        </button>
        <p className="text-sm text-gray-700">
          Already have an account?{" "}
          <Link to="/signin" className="text-blue-700 hover:underline">
            Sign In
          </Link>
        </p>
      </form>
    </CloudBackground>
  );
};

export default SignUp;
