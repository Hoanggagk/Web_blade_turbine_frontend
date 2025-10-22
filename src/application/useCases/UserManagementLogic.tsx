import React, { useEffect, useState } from "react";
import UserManagementPage from "../../presentation/pages/UserManagementPage";
import { authServiceLong } from "../../infrastructure/http/auth/authService";
import type { UserListResponse } from "../../domain/auth/models";

type User = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  status: "Active" | "Inactive";
};

const UserManagementLogic: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [approveLoading, setApproveLoading] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [loadingList, setLoadingList] = useState(false); // ✅ mới

  // debounce search
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(searchTerm), 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const fetchUsers = async () => {
    setLoadingList(true); // ✅ start
    const res = await authServiceLong.getAllUsers();
    setLoadingList(false); // ✅ end

    if (!res.ok) {
      alert(res.message || "Failed to fetch users");
      return;
    }

    const filtered = res.data.filter(
      (u: UserListResponse) => u.role === "user" && u.is_active === true
    );

    const mapped: User[] = filtered.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      role: u.role,
      status: u.is_approved ? "Active" : "Inactive",
    }));

    setUsers(mapped);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleApproveClick = async (user: User) => {
    setApproveLoading(user.id);
    const res = await authServiceLong.approveUser({ user_id: user.id });
    setApproveLoading(null);

    if (!res.ok) {
      alert(res.message || "Approve failed");
      return;
    }

    alert(res.data.message || "Approve success");
    fetchUsers();
  };

  const handleDelete = async (user: User) => {
    if (!window.confirm(`Ban co chac muon xoa user: ${user.name}?`)) return;

    setDeleteLoading(user.id);
    const res = await authServiceLong.deleteUser(user.id);
    setDeleteLoading(null);

    if (!res.ok) {
      alert(res.message || "Delete failed");
      return;
    }

    alert(res.data.message || "Delete success");
    fetchUsers();
  };

  const filteredUsers = users.filter((u) => {
    const keyword = debouncedSearch.toLowerCase();
    return (
      u.email.toLowerCase().includes(keyword) ||
      u.phone.toLowerCase().includes(keyword)
    );
  });

  return (
    <UserManagementPage
      users={filteredUsers}
      searchTerm={searchTerm}
      setSearchTerm={setSearchTerm}
      approveLoading={approveLoading}
      deleteLoading={deleteLoading}
      onApproveClick={handleApproveClick}
      onDeleteClick={handleDelete}
      loadingList={loadingList}
    />
  );
};

export default UserManagementLogic;
