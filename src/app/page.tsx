"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState, useId } from "react";

export default function Home() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const nameId = useId();
  const emailId = useId();
  
  const users = useQuery(api.users.listUsers);
  const createUser = useMutation(api.users.createUser);

  const handleCreateUser = async () => {
    if (name && email) {
      await createUser({ name, email });
      setName("");
      setEmail("");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            ConstellAI
          </h1>
          <p className="text-xl text-gray-600">
            Next.js + Tailwind v4 + Biome + Convex
          </p>
        </header>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Create User Form */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold mb-4">Create User</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor={nameId} className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  id={nameId}
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter name"
                />
              </div>
              <div>
                <label htmlFor={emailId} className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  id={emailId}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter email"
                />
              </div>
              <button
                type="button"
                onClick={handleCreateUser}
                disabled={!name || !email}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Create User
              </button>
            </div>
          </div>

          {/* Users List */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold mb-4">Users</h2>
            {users === undefined ? (
              <p className="text-gray-500">Loading users...</p>
            ) : users.length === 0 ? (
              <p className="text-gray-500">No users found. Create one above!</p>
            ) : (
              <div className="space-y-3">
                {users.map((user) => (
                  <div key={user._id} className="border border-gray-200 rounded-md p-3">
                    <h3 className="font-medium text-gray-900">{user.name}</h3>
                    <p className="text-sm text-gray-600">{user.email}</p>
                    <p className="text-xs text-gray-400">
                      Created: {new Date(user.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Tech Stack Info */}
        <div className="mt-12 bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-semibold mb-4">Tech Stack</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-900">Next.js 15</h3>
              <p className="text-sm text-blue-700">React Framework</p>
            </div>
            <div className="text-center p-4 bg-cyan-50 rounded-lg">
              <h3 className="font-semibold text-cyan-900">Tailwind v4</h3>
              <p className="text-sm text-cyan-700">CSS Framework</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <h3 className="font-semibold text-green-900">Biome</h3>
              <p className="text-sm text-green-700">Linter & Formatter</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <h3 className="font-semibold text-purple-900">Convex</h3>
              <p className="text-sm text-purple-700">Backend & Database</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
