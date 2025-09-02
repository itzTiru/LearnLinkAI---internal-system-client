"use client";
import { useState } from "react";

export default function PersonalPage() {
  const [personal, setPersonal] = useState({ name: "", age: "", email: "" });
  const [education, setEducation] = useState([]);
  const [work, setWork] = useState([]);

  // Handle adding new education entry
  const addEducation = () =>
    setEducation([...education, { university: "", degree: "", field: "", start_year: "", end_year: "" }]);

  // Handle adding new work entry
  const addWork = () =>
    setWork([...work, { company: "", role: "", field: "", start_year: "", end_year: "" }]);

  const handlePersonalChange = (e) =>
    setPersonal({ ...personal, [e.target.name]: e.target.value });

  const handleEducationChange = (index, e) => {
    const updated = [...education];
    updated[index][e.target.name] = e.target.value;
    setEducation(updated);
  };

  const handleWorkChange = (index, e) => {
    const updated = [...work];
    updated[index][e.target.name] = e.target.value;
    setWork(updated);
  };

  const handleSubmit = async (e) => {
  e.preventDefault();

  const payload = {
    ...personal,
    education,
    work
  };

  const res = await fetch("http://localhost:8000/personal/save", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  console.log("Saved:", data);
  alert("Profile Saved Successfully!");
};

  return (
    <div className="max-w-3xl mx-auto mt-10 p-6 border rounded-xl shadow-md bg-white">
      <h2 className="text-2xl font-bold mb-6">Educational Profile</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">

        {/* Personal Section */}
        <h3 className="text-xl font-semibold">Personal Info</h3>
        <input className="border p-2 rounded" name="name" placeholder="Full Name"
          value={personal.name} onChange={handlePersonalChange} required />
        <input className="border p-2 rounded" name="age" type="number" placeholder="Age"
          value={personal.age} onChange={handlePersonalChange} required />
        <input className="border p-2 rounded" name="email" type="email" placeholder="Email"
          value={personal.email} onChange={handlePersonalChange} required />

        {/* Education Section */}
        <h3 className="text-xl font-semibold">Education</h3>
        {education.map((edu, index) => (
          <div key={index} className="p-3 border rounded">
            <input className="border p-2 rounded w-full mb-2" name="university"
              placeholder="University" value={edu.university} onChange={(e) => handleEducationChange(index, e)} />
            <input className="border p-2 rounded w-full mb-2" name="degree"
              placeholder="Degree" value={edu.degree} onChange={(e) => handleEducationChange(index, e)} />
            <input className="border p-2 rounded w-full mb-2" name="field"
              placeholder="Field of Study" value={edu.field} onChange={(e) => handleEducationChange(index, e)} />
            <div className="flex gap-2">
              <input className="border p-2 rounded w-1/2" name="start_year" type="number"
                placeholder="Start Year" value={edu.start_year} onChange={(e) => handleEducationChange(index, e)} />
              <input className="border p-2 rounded w-1/2" name="end_year" type="number"
                placeholder="End Year" value={edu.end_year} onChange={(e) => handleEducationChange(index, e)} />
            </div>
          </div>
        ))}
        <button type="button" onClick={addEducation} className="bg-green-600 text-white px-3 py-1 rounded">
          + Add Education
        </button>

        {/* Work Section */}
        <h3 className="text-xl font-semibold">Work Experience</h3>
        {work.map((job, index) => (
          <div key={index} className="p-3 border rounded">
            <input className="border p-2 rounded w-full mb-2" name="company"
              placeholder="Company" value={job.company} onChange={(e) => handleWorkChange(index, e)} />
            <input className="border p-2 rounded w-full mb-2" name="role"
              placeholder="Role / Job Title" value={job.role} onChange={(e) => handleWorkChange(index, e)} />
            <input className="border p-2 rounded w-full mb-2" name="field"
              placeholder="Field (e.g., IT, Business, Medicine)" value={job.field} onChange={(e) => handleWorkChange(index, e)} />
            <div className="flex gap-2">
              <input className="border p-2 rounded w-1/2" name="start_year" type="number"
                placeholder="Start Year" value={job.start_year} onChange={(e) => handleWorkChange(index, e)} />
              <input className="border p-2 rounded w-1/2" name="end_year" type="number"
                placeholder="End Year" value={job.end_year} onChange={(e) => handleWorkChange(index, e)} />
            </div>
          </div>
        ))}
        <button type="button" onClick={addWork} className="bg-green-600 text-white px-3 py-1 rounded">
          + Add Work
        </button>

        <button type="submit" className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700 mt-4">
          Save Profile
        </button>
      </form>
    </div>
  );
}
