import Sidebar from "../components/sidebar";
import "../styles/UserManagementPage.css";
import Button from "../components/button";
import Toolbar from "../components/Toolbar";
import GenericTable from "../components/table";
import type { Column } from "../components/table";

type User = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  status: "Active" | "Inactive";
};

type UserManagementPageProps = {
  users: User[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  onApproveClick: (user: User) => void;
  approveLoading: string | null;
  deleteLoading: string | null;
  onDeleteClick: (user: User) => void;

  // ✅ mới: để GenericTable hiện loading
  loadingList?: boolean;
};

function UserManagementPage({
  users,
  searchTerm,
  setSearchTerm,
  approveLoading,
  deleteLoading,
  onApproveClick,
  onDeleteClick,
  loadingList,
}: UserManagementPageProps) {
  // ---------------- Cấu hình cột ----------------
  const columns: Column<User>[] = [
    {
      key: "index",
      header: "#",
      size: 0.06,
      align: "center",
      render: (_row, i) => i + 1, // ✅ dùng _row để tránh lỗi TS6133
      headerClassName: "col-center",
      className: "col-center",
    },
    {
      key: "name",
      header: "Name",
      size: 0.22,
      sortable: true,
      sortAccessor: (u) => u.name.toLowerCase(),
    },
    {
      key: "email",
      header: "Email",
      size: 0.26,
      sortable: true,
      sortAccessor: (u) => u.email.toLowerCase(),
    },
    {
      key: "phone",
      header: "Phone",
      size: 0.16,
      sortable: true,
      sortAccessor: (u) => u.phone,
    },
    {
      key: "role",
      header: "Role",
      size: 0.1,
      align: "center",
      sortable: true,
      sortAccessor: (u) => u.role,
      headerClassName: "col-center",
      className: "col-center",
    },
    {
      key: "status",
      header: "Status",
      size: 0.1,
      align: "center",
      sortable: true,
      sortAccessor: (u) => u.status,
      headerClassName: "col-center",
      className: "col-center",
      render: (user) => (
        <span className={`status-badge ${user.status === "Active" ? "status-badge--active" : "status-badge--inactive"}`}>
          {user.status}
        </span>
      ),
    },
        {
      key: "actions",
      header: "Action",
      size: 0.16,
      className: "action-cell",
      render: (user) => (
        <div className="user-management__actions">
          <Button
            variant="delete"
            onClick={(event: any) => {
              event.stopPropagation();
              onDeleteClick(user);
            }}
            loading={deleteLoading === user.id}
          >
            Delete
          </Button>
          <Button
            variant="approve"
            hidden={user.status === "Active"}
            onClick={(event: any) => {
              event.stopPropagation();
              onApproveClick(user);
            }}
            loading={approveLoading === user.id}
          >
            Approve
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="app-shell app-shell--viewport user-management">
      <aside className="page-sidebar">
        <Sidebar />
      </aside>

      <main className="page-main page-main--padded">
        <div className="page-body">
          <Toolbar>
            <Toolbar.Search>
              <Toolbar.SearchInput
                placeholder="Search email or phone..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </Toolbar.Search>
          </Toolbar>

          <div className="user-management__table">
            <GenericTable<User>
              data={users}
              columns={columns}
              loading={!!loadingList}
              emptyText="No users"
              stickyHeader
              cellProps={(_row, col) =>
                col.key === "actions" ? { onClick: (event) => event.stopPropagation() } : {}
              }
            />
          </div>
        </div>
      </main>
    </div>
  );
}

export default UserManagementPage;







