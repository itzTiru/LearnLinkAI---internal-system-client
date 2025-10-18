"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [showEducationPopup, setShowEducationPopup] = useState(false);
  const [showWorkPopup, setShowWorkPopup] = useState(false);
  const [showProjectsPopup, setShowProjectsPopup] = useState(false);
  const [newEducation, setNewEducation] = useState({ university: "", degree: "", field: "", start_year: "", end_year: "" });
  const [newWork, setNewWork] = useState({ company: "", role: "", field: "", start_year: "", end_year: "" });
  const [newProject, setNewProject] = useState({ name: "", description: "", technologies: "", start_year: "", end_year: "" });
  const router = useRouter();
  const [sessionManagement, setSessionManagement] = useState(null);

  // Dynamically import session-management
  useEffect(() => {
    import("../../lib/session-management").then((mod) => {
      setSessionManagement(mod.default || mod);
    });
  }, []);

  // Load profile
  useEffect(() => {
    const loadProfile = async () => {
      if (!sessionManagement) return;

      const token = sessionManagement.getToken();
      if (!token || !sessionManagement.isAuthenticated()) {
        sessionManagement.clearToken();
        router.replace("/login");
        return;
      }

      try {
        const decodedUser = sessionManagement.getUser();
        if (!decodedUser) throw new Error("Invalid session");

        const email = decodedUser.email;
        const encodedEmail = encodeURIComponent(email);

        const res = await fetch(`http://localhost:8000/personal/${encodedEmail}`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (!res.ok) {
          if (res.status === 401) {
            sessionManagement.clearToken();
            router.replace("/login");
            return;
          }
          throw new Error("Failed to fetch profile");
        }
        const data = await res.json();
        setUser(data);
      } catch (err) {
        console.error("Profile load error:", err);
        setError("Failed to load profile. Please try again later.");
        if (err.message.includes("401") || err.message.includes("session")) {
          sessionManagement.clearToken();
          router.replace("/login");
        }
      }
    };

    loadProfile();
  }, [sessionManagement, router]);

  if (!user && !error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <p className="text-red-500 text-center">{error}</p>
          <button 
            onClick={() => router.push('/login')}
            className="mt-4 w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  const handleShareProfile = () => {
    const profileLink = `${window.location.origin}/profile?email=${encodeURIComponent(user.email)}`;
    navigator.clipboard.writeText(profileLink).then(() => {
      alert("Profile link copied to clipboard!");
    }).catch((err) => {
      console.error("Failed to copy link:", err);
      alert("Failed to copy profile link.");
    });
  };

  const handleEducationSubmit = async (e) => {
    e.preventDefault();
    if (newEducation.university && newEducation.degree && newEducation.field && newEducation.start_year && newEducation.end_year) {
      const updatedEducation = [...(user.education || []), newEducation];
      const updatedUser = { ...user, education: updatedEducation };
      const token = sessionManagement.getToken();
      const response = await fetch("http://localhost:8000/personal/save", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(updatedUser),
      });
      if (response.ok) {
        setUser(updatedUser);
        setShowEducationPopup(false);
        setNewEducation({ university: "", degree: "", field: "", start_year: "", end_year: "" });
        alert("Education added successfully!");
      } else {
        alert("Failed to add education.");
      }
    } else {
      alert("Please fill all fields.");
    }
  };

  const handleWorkSubmit = async (e) => {
    e.preventDefault();
    if (newWork.company && newWork.role && newWork.field && newWork.start_year && newWork.end_year) {
      const updatedWork = [...(user.work || []), newWork];
      const updatedUser = { ...user, work: updatedWork };
      const token = sessionManagement.getToken();
      const response = await fetch("http://localhost:8000/personal/save", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(updatedUser),
      });
      if (response.ok) {
        setUser(updatedUser);
        setShowWorkPopup(false);
        setNewWork({ company: "", role: "", field: "", start_year: "", end_year: "" });
        alert("Work experience added successfully!");
      } else {
        alert("Failed to add work experience.");
      }
    } else {
      alert("Please fill all fields.");
    }
  };

  const handleProjectSubmit = async (e) => {
    e.preventDefault();
    if (newProject.name && newProject.description && newProject.technologies && newProject.start_year && newProject.end_year) {
      const updatedProjects = [...(user.projects || []), newProject];
      const updatedUser = { ...user, projects: updatedProjects };
      const token = sessionManagement.getToken();
      const response = await fetch("http://localhost:8000/personal/save", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(updatedUser),
      });
      if (response.ok) {
        setUser(updatedUser);
        setShowProjectsPopup(false);
        setNewProject({ name: "", description: "", technologies: "", start_year: "", end_year: "" });
        alert("Project added successfully!");
      } else {
        alert("Failed to add project.");
      }
    } else {
      alert("Please fill all fields.");
    }
  };

  const handleEducationChange = (e) => setNewEducation({ ...newEducation, [e.target.name]: e.target.value });
  const handleWorkChange = (e) => setNewWork({ ...newWork, [e.target.name]: e.target.value });
  const handleProjectChange = (e) => setNewProject({ ...newProject, [e.target.name]: e.target.value });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <div className="max-w-5xl mx-auto p-6 flex space-x-6">
        {/* Left Panel */}
        <aside className="w-1/4 bg-white shadow-md rounded-lg p-4 h-fit sticky top-20">
          <div className="flex flex-col items-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-md">
              {user.name ? user.name[0].toUpperCase() : "U"}
            </div>
            <h2 className="text-lg font-semibold mt-3 text-center">{user.name || "User"}</h2>
            <p className="text-sm text-gray-500 text-center">{user.email}</p>
            <button 
              onClick={handleShareProfile} 
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition w-full"
            >
              Share profile link
            </button>
            <button className="mt-2 text-blue-600 text-sm hover:underline">
              Update profile visibility
            </button>
          </div>
          <div className="mt-6">
            <h3 className="font-semibold text-gray-900 mb-3">Highlights</h3>
            <ul className="space-y-2">
              {user.education && user.education.length > 0 ? (
                user.education.map((edu, index) => (
                  <li key={index} className="flex items-center space-x-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></span>
                    <span className="text-sm text-gray-700">{edu.field} ({edu.degree})</span>
                  </li>
                ))
              ) : (
                <li className="text-gray-500 text-sm">No highlights available</li>
              )}
            </ul>
            <h3 className="font-semibold text-gray-900 mt-6 mb-2">Work preferences</h3>
            <p className="text-blue-600 text-sm mb-1">Desired roles</p>
            <p className="text-gray-600 text-sm">Data Scientist</p>
          </div>
        </aside>

        {/* Right Panel */}
        <main className="w-3/4 bg-white shadow-md rounded-lg p-6">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Experience</h2>
            
            {/* Projects Section */}
            <div className="mb-4 p-5 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 transition">
              <h3 className="font-semibold text-gray-700 mb-2">Projects</h3>
              {user.projects && user.projects.length > 0 ? (
                <div className="space-y-3">
                  {user.projects.map((proj, index) => (
                    <div key={index} className="bg-gray-50 p-3 rounded-md">
                      <p className="font-medium text-gray-900">{proj.name}</p>
                      <p className="text-sm text-gray-600 mt-1">{proj.description}</p>
                      <p className="text-xs text-blue-600 mt-1">Technologies: {proj.technologies}</p>
                      <p className="text-xs text-gray-500 mt-1">{proj.start_year} - {proj.end_year}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">Showcase your skills to recruiters with job-relevant projects</p>
              )}
              <button 
                onClick={() => setShowProjectsPopup(true)} 
                className="mt-3 text-blue-600 text-sm hover:underline font-medium"
              >
                + Add project
              </button>
            </div>

            {/* Work History Section */}
            <div className="p-5 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 transition">
              <h3 className="font-semibold text-gray-700 mb-2">Work history</h3>
              {user.work && user.work.length > 0 ? (
                <div className="space-y-3">
                  {user.work.map((job, index) => (
                    <div key={index} className="bg-gray-50 p-3 rounded-md">
                      <p className="font-medium text-gray-900">{job.role}</p>
                      <p className="text-sm text-gray-600">{job.company}</p>
                      <p className="text-xs text-gray-500 mt-1">{job.field} • {job.start_year} - {job.end_year}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">
                  Add your work experience here. If you're just starting out, you can add internships or volunteer experience instead.
                </p>
              )}
              <button 
                onClick={() => setShowWorkPopup(true)} 
                className="mt-3 text-blue-600 text-sm hover:underline font-medium"
              >
                + Add work experience
              </button>
            </div>
          </div>

          {/* Education Section */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Education</h2>
            <div className="p-5 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 transition">
              <h3 className="font-semibold text-gray-700 mb-2">Credentials</h3>
              {user.education && user.education.length > 0 ? (
                <div className="space-y-3">
                  {user.education.map((edu, index) => (
                    <div key={index} className="bg-gray-50 p-3 rounded-md">
                      <p className="font-medium text-gray-900">{edu.degree} in {edu.field}</p>
                      <p className="text-sm text-gray-600">{edu.university}</p>
                      <p className="text-xs text-gray-500 mt-1">{edu.start_year} - {edu.end_year}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No education details available.</p>
              )}
              <button 
                onClick={() => setShowEducationPopup(true)} 
                className="mt-3 text-blue-600 text-sm hover:underline font-medium"
              >
                + Add education
              </button>
            </div>
          </div>

          {/* Bookmarks Section */}
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Bookmarks</h2>
            <div className="p-5 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 transition">
              <h3 className="font-semibold text-gray-700 mb-2">Saved Links</h3>
              {user.bookmarks && user.bookmarks.length > 0 ? (
                <div className="space-y-3">
                  {user.bookmarks.map((bookmark, index) => (
                    <div key={index} className="bg-gray-50 p-3 rounded-md">
                      <a 
                        href={bookmark} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-blue-600 hover:underline text-sm break-all"
                      >
                        {bookmark}
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No bookmarks yet. Discover and save resources from your searches.</p>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Education Popup */}
      {showEducationPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">Add Education</h3>
            <form onSubmit={handleEducationSubmit} className="flex flex-col gap-4">
              <input className="border p-2 rounded w-full focus:ring-2 focus:ring-blue-500 focus:outline-none" name="university" placeholder="University" value={newEducation.university} onChange={handleEducationChange} required />
              <input className="border p-2 rounded w-full focus:ring-2 focus:ring-blue-500 focus:outline-none" name="degree" placeholder="Degree" value={newEducation.degree} onChange={handleEducationChange} required />
              <input className="border p-2 rounded w-full focus:ring-2 focus:ring-blue-500 focus:outline-none" name="field" placeholder="Field of Study" value={newEducation.field} onChange={handleEducationChange} required />
              <div className="flex gap-2">
                <input className="border p-2 rounded w-1/2 focus:ring-2 focus:ring-blue-500 focus:outline-none" name="start_year" type="number" placeholder="Start Year" value={newEducation.start_year} onChange={handleEducationChange} required />
                <input className="border p-2 rounded w-1/2 focus:ring-2 focus:ring-blue-500 focus:outline-none" name="end_year" type="number" placeholder="End Year" value={newEducation.end_year} onChange={handleEducationChange} required />
              </div>
              <div className="flex justify-end gap-2 mt-2">
                <button type="button" onClick={() => setShowEducationPopup(false)} className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition">Cancel</button>
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Work Popup */}
      {showWorkPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">Add Work Experience</h3>
            <form onSubmit={handleWorkSubmit} className="flex flex-col gap-4">
              <input className="border p-2 rounded w-full focus:ring-2 focus:ring-blue-500 focus:outline-none" name="company" placeholder="Company" value={newWork.company} onChange={handleWorkChange} required />
              <input className="border p-2 rounded w-full focus:ring-2 focus:ring-blue-500 focus:outline-none" name="role" placeholder="Role / Job Title" value={newWork.role} onChange={handleWorkChange} required />
              <input className="border p-2 rounded w-full focus:ring-2 focus:ring-blue-500 focus:outline-none" name="field" placeholder="Field (e.g., IT, Business, Medicine)" value={newWork.field} onChange={handleWorkChange} required />
              <div className="flex gap-2">
                <input className="border p-2 rounded w-1/2 focus:ring-2 focus:ring-blue-500 focus:outline-none" name="start_year" type="number" placeholder="Start Year" value={newWork.start_year} onChange={handleWorkChange} required />
                <input className="border p-2 rounded w-1/2 focus:ring-2 focus:ring-blue-500 focus:outline-none" name="end_year" type="number" placeholder="End Year" value={newWork.end_year} onChange={handleWorkChange} required />
              </div>
              <div className="flex justify-end gap-2 mt-2">
                <button type="button" onClick={() => setShowWorkPopup(false)} className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition">Cancel</button>
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Projects Popup */}
      {showProjectsPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">Add Project</h3>
            <form onSubmit={handleProjectSubmit} className="flex flex-col gap-4">
              <input className="border p-2 rounded w-full focus:ring-2 focus:ring-blue-500 focus:outline-none" name="name" placeholder="Project Name" value={newProject.name} onChange={handleProjectChange} required />
              <textarea className="border p-2 rounded w-full focus:ring-2 focus:ring-blue-500 focus:outline-none" name="description" placeholder="Description" value={newProject.description} onChange={handleProjectChange} rows={3} required />
              <input className="border p-2 rounded w-full focus:ring-2 focus:ring-blue-500 focus:outline-none" name="technologies" placeholder="Technologies (comma-separated)" value={newProject.technologies} onChange={handleProjectChange} required />
              <div className="flex gap-2">
                <input className="border p-2 rounded w-1/2 focus:ring-2 focus:ring-blue-500 focus:outline-none" name="start_year" type="number" placeholder="Start Year" value={newProject.start_year} onChange={handleProjectChange} required />
                <input className="border p-2 rounded w-1/2 focus:ring-2 focus:ring-blue-500 focus:outline-none" name="end_year" type="number" placeholder="End Year" value={newProject.end_year} onChange={handleProjectChange} required />
              </div>
              <div className="flex justify-end gap-2 mt-2">
                <button type="button" onClick={() => setShowProjectsPopup(false)} className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition">Cancel</button>
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}