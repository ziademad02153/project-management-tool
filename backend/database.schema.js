/**
 * MongoDB Database Schema
 * 
 * This file describes the data structure of our MongoDB collections
 */

// User Collection
const userExample = {
  username: "john_doe",
  email: "john@example.com",
  password: "hashed_password", // Will be automatically hashed
  createdAt: "2025-01-04T16:28:31.000Z",
  updatedAt: "2025-01-04T16:28:31.000Z"
};

// Project Collection
const projectExample = {
  name: "Website Redesign",
  description: "Redesigning company website",
  owner: "user_id_reference",
  status: "active", // ['active', 'completed', 'on-hold']
  members: [
    {
      user: "user_id_reference",
      role: "owner" // ['owner', 'member']
    }
  ],
  createdAt: "2025-01-04T16:28:31.000Z",
  updatedAt: "2025-01-04T16:28:31.000Z"
};

// Task Collection
const taskExample = {
  title: "Design Homepage",
  description: "Create new homepage design",
  project: "project_id_reference",
  assignedTo: "user_id_reference",
  status: "pending", // ['pending', 'in-progress', 'completed']
  priority: "high", // ['low', 'medium', 'high']
  deadline: "2025-02-01T00:00:00.000Z",
  createdAt: "2025-01-04T16:28:31.000Z",
  updatedAt: "2025-01-04T16:28:31.000Z"
};

// This file is for documentation purposes only
// The actual schema is implemented in the models/ directory
