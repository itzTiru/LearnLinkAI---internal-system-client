// "use client";

// import { useEffect, useState } from "react";

// export default function ProfilePage() {
//   const [user, setUser] = useState(null);
//   const [error, setError] = useState(null);

//   useEffect(() => {
//     const email = "abc@gmail.com"; // Hardcoded email
//     const encodedEmail = encodeURIComponent(email);

//     fetch(`http://localhost:8000/personal/${encodedEmail}`)
//       .then((res) => {
//         if (!res.ok) throw new Error("Failed to fetch profile");
//         return res.json();
//       })
//       .then((data) => setUser(data))
//       .catch((err) => {
//         console.error("Error fetching profile:", err);
//         setError("Failed to load profile. Please try again later.");
//       });
//   }, []);

//   if (!user && !error) {
//     return <p className="text-center mt-10">Loading profile...</p>;
//   }

//   if (error) {
//     return <p className="text-center mt-10 text-red-500">{error}</p>;
//   }

//   // Handler for Share profile link
//   const handleShareProfile = () => {
//     const profileLink = `${window.location.origin}/profile?email=${encodeURIComponent(user.email)}`;
//     navigator.clipboard.writeText(profileLink).then(() => {
//       alert("Profile link copied to clipboard!");
//     }).catch((err) => {
//       console.error("Failed to copy link:", err);
//       alert("Failed to copy profile link.");
//     });
//   };

//   // Handler for Add work experience
//   const handleAddWorkExperience = async () => {
//     const newWork = {
//       company: prompt("Enter company name:"),
//       role: prompt("Enter role:"),
//       field: prompt("Enter field:"),
//       start_year: parseInt(prompt("Enter start year:")),
//       end_year: parseInt(prompt("Enter end year:")),
//     };

//     if (newWork.company && newWork.role && newWork.field && !isNaN(newWork.start_year) && !isNaN(newWork.end_year)) {
//       const updatedUser = {
//         ...user,
//         work: [...user.work, newWork],
//       };

//       const response = await fetch("http://localhost:8000/personal/save", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(updatedUser),
//       });

//       if (response.ok) {
//         setUser(updatedUser);
//         alert("Work experience added successfully!");
//       } else {
//         alert("Failed to add work experience.");
//       }
//     } else {
//       alert("Please fill all fields with valid data.");
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gray-50">
//       {/* Header */}
//       <header className="bg-white shadow-sm p-4 flex justify-between items-center">
//         <div className="flex items-center space-x-4">
//           <img src="https://via.placeholder.com/40" alt="Logo" className="h-10" />
//           <div>
//             <h1 className="text-lg font-semibold">Explore</h1>
//             <p className="text-sm text-gray-600">What do you want to learn?</p>
//           </div>
//         </div>
//         <div className="flex items-center space-x-4">
//           <button className="text-blue-600">Online Degrees</button>
//           <button className="text-blue-600">Careers</button>
//           <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white">
//             {user.name ? user.name[0] : "T"}
//           </div>
//         </div>
//       </header>

//       {/* Main Content */}
//       <div className="max-w-5xl mx-auto p-6 flex space-x-6">
//         {/* Left Panel */}
//         <aside className="w-1/4 bg-white shadow-md rounded-lg p-4">
//           <div className="flex flex-col items-center mb-4">
//             <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
//               {user.name ? user.name[0] : "T"}
//             </div>
//             <h2 className="text-lg font-semibold mt-2">{user.name || "Tishan Yasiru Panditha"}</h2>
//             <button onClick={handleShareProfile} className="mt-2 bg-blue-600 text-white px-4 py-1 rounded">
//               Share profile link
//             </button>
//             <button className="mt-1 text-blue-600 text-sm">Update profile visibility</button>
//           </div>
//           <div className="mt-4">
//             <h3 className="font-semibold">Highlights</h3>
//             <ul className="mt-2 space-y-2">
//               {user.education && user.education.length > 0 ? (
//                 user.education.map((edu, index) => (
//                   <li key={index} className="flex items-center space-x-2">
//                     <span className="w-2 h-2 bg-red-500 rounded-full"></span>
//                     <span>
//                       {edu.field} ({edu.degree})
//                     </span>
//                   </li>
//                 ))
//               ) : (
//                 <li className="text-gray-500">No highlights available</li>
//               )}
//             </ul>
//             <h3 className="font-semibold mt-4">Work preferences</h3>
//             <p className="text-blue-600 mt-2">Desired roles</p>
//             <p className="text-gray-600">Data Scientist</p>
//           </div>
//         </aside>

//         {/* Right Panel */}
//         <main className="w-3/4 bg-white shadow-md rounded-lg p-4">
//           <div className="mb-6">
//             <h2 className="text-xl font-semibold">Experience</h2>
//             <div className="mt-2 p-4 border-dashed border-2 border-gray-300">
//               <p className="text-gray-500">Projects</p>
//               <p className="text-sm text-gray-400">Showcase your skills to recruiters with job-relevant projects</p>
//               <button className="mt-2 text-blue-600 text-sm">Browse Projects</button>
//             </div>
//             <div className="mt-4 p-4 border-dashed border-2 border-gray-300">
//               <p className="text-gray-500">Work history</p>
//               <p className="text-sm text-gray-400">
//                 {user.work && user.work.length > 0
//                   ? user.work.map((job, index) => (
//                       <span key={index}>
//                         {job.company} - {job.role} ({job.start_year} - {job.end_year})
//                         {index < user.work.length - 1 && ", "}
//                       </span>
//                     ))
//                   : "Add your work experience here. If you're just starting out, you can add internships or volunteer experience instead."}
//               </p>
//               <button onClick={handleAddWorkExperience} className="mt-2 text-blue-600 text-sm">
//                 + Add work experience
//               </button>
//             </div>
//           </div>
//           <div>
//             <h2 className="text-xl font-semibold">Education</h2>
//             <div className="mt-2 p-4 border-dashed border-2 border-gray-300">
//               <p className="text-gray-500">Credentials</p>
//               {user.education && user.education.length > 0 ? (
//                 user.education.map((edu, index) => (
//                   <p key={index} className="text-sm text-gray-400">
//                     {edu.university} - {edu.degree} in {edu.field} ({edu.start_year} - {edu.end_year})
//                   </p>
//                 ))
//               ) : (
//                 <p className="text-sm text-gray-400">No education details available.</p>
//               )}
//               <button className="mt-2 text-blue-600 text-sm">+ Add</button>
//             </div>
//           </div>
//         </main>
//       </div>
//     </div>
//   );
// }