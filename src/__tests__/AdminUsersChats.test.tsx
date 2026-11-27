import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, useLocation } from "react-router-dom";
import type { AdminConversation, User } from "../api/types";

const setMe = vi.hoisted(() => vi.fn());
vi.mock("../contexts/AuthContext", () => ({ useAuth: () => ({ user: { id: "1" }, setUser: setMe }) }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

vi.mock("../api/admin.api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../api/admin.api")>();
  return { ...actual, adminApi: { getUsers: vi.fn(), getAllChats: vi.fn(), updateUser: vi.fn() } };
});

import { adminApi } from "../api/admin.api";
import { AdminPage } from "../pages/admin/AdminPage";

const getUsers = vi.mocked(adminApi.getUsers);
const getAllChats = vi.mocked(adminApi.getAllChats);
const updateUser = vi.mocked(adminApi.updateUser);

const user = (id: string, display_name: string): User => ({
  id,
  email: `${display_name.toLowerCase()}@pduni.edu.vn`,
  display_name,
  role: "student",
  credits: 5,
  storage_used: 0,
  storage_limit: 236 * 1024 * 1024,
  first_use: null,
  state: "active",
});

const chat = (id: string, userId: string, userName: string | null, title = `Chat ${id}`): AdminConversation => ({
  id,
  title,
  userId,
  userName,
  disabled: false,
  asyncStatus: "none",
});

const ALICE = user("4200000000000000001", "Alice");

function LocationProbe() {
  const loc = useLocation();
  return <output data-testid="url">{loc.pathname + loc.search}</output>;
}

const renderAdmin = (entry: string) =>
  render(
    <MemoryRouter initialEntries={[entry]}>
      <AdminPage />
      <LocationProbe />
    </MemoryRouter>,
  );

beforeEach(() => {
  vi.clearAllMocks();
  // Alice is NOT on page 1 of the users list; only the exact lookup finds her.
  getUsers.mockImplementation(async (_page, userId) => (userId ? (userId === ALICE.id ? [ALICE] : []) : [user("1", "Admin")]));
  getAllChats.mockResolvedValue([]);
});

describe("Admin chats -> user", () => {
  it("shows the owner's name, and clicking it opens that exact (off-page) user on the Users tab", async () => {
    const u = userEvent.setup();
    getAllChats.mockResolvedValue([chat("11", ALICE.id, "Alice")]);
    renderAdmin("/admin?tab=chats");

    expect(screen.queryByText(ALICE.id)).not.toBeInTheDocument();
    await u.click(await screen.findByRole("link", { name: "Alice" }));

    expect(screen.getByTestId("url")).toHaveTextContent(`/admin?tab=users&user_id=${ALICE.id}`);
    const dialog = await screen.findByRole("dialog");
    expect(await within(dialog).findByText("alice@pduni.edu.vn")).toBeInTheDocument();
    expect(getUsers).toHaveBeenCalledWith(1, ALICE.id);
    // The list itself still shows page 1 only.
    expect(getUsers).toHaveBeenCalledWith(1);
  });

  it("shows 'Người dùng đã xoá' without a link when the owner was deleted", async () => {
    getAllChats.mockResolvedValue([chat("12", "777", null)]);
    renderAdmin("/admin?tab=chats");
    expect(await screen.findByText("Người dùng đã xoá")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Người dùng đã xoá/ })).not.toBeInTheDocument();
  });
});

describe("Admin user -> chats", () => {
  it("opens the user details from a link and filters the chats by that user", async () => {
    const u = userEvent.setup();
    getAllChats.mockImplementation(async (_p, userId) => (userId ? [chat("21", ALICE.id, "Alice", "Alice chat")] : []));
    renderAdmin(`/admin?tab=users&user_id=${ALICE.id}`);

    const dialog = await screen.findByRole("dialog");
    const link = await within(dialog).findByRole("link", { name: /Xem cuộc trò chuyện của người dùng này/i });
    expect(link).toHaveAttribute("href", `/admin?tab=chats&user_id=${ALICE.id}`);

    await u.click(link);

    expect(await screen.findByText("Alice chat")).toBeInTheDocument();
    expect(getAllChats).toHaveBeenLastCalledWith(1, ALICE.id);
    expect(await screen.findByText(/Đang lọc theo người dùng/)).toHaveTextContent("Alice");
  });

  it("keeps the real name in the filter even when the user has no chats", async () => {
    renderAdmin(`/admin?tab=chats&user_id=${ALICE.id}`);
    expect(await screen.findByText("Người dùng này chưa có cuộc trò chuyện nào.")).toBeInTheDocument();
    expect(await screen.findByText(/Đang lọc theo người dùng/)).toHaveTextContent("Alice");
  });

  it("clearing the filter lists everyone again from page 1", async () => {
    const u = userEvent.setup();
    const ten = Array.from({ length: 10 }, (_, i) => chat(String(100 + i), ALICE.id, "Alice"));
    getAllChats.mockResolvedValue(ten);
    renderAdmin(`/admin?tab=chats&user_id=${ALICE.id}`);

    await screen.findByText("Chat 100");
    await u.click(screen.getByRole("button", { name: /Sau/ }));
    await waitFor(() => expect(getAllChats).toHaveBeenCalledWith(2, ALICE.id));

    await u.click(await screen.findByRole("button", { name: "Xoá bộ lọc người dùng" }));

    await waitFor(() => expect(getAllChats).toHaveBeenLastCalledWith(1, null));
    expect(getAllChats).not.toHaveBeenCalledWith(2, null);
    expect(screen.getByTestId("url")).toHaveTextContent("/admin?tab=chats");
    expect(screen.queryByText(/Đang lọc theo người dùng/)).not.toBeInTheDocument();
    expect(await screen.findByText("Trang 1")).toBeInTheDocument();
  });

  it("ignores a slow response for an older filter", async () => {
    const u = userEvent.setup();
    let resolveSlow!: (items: AdminConversation[]) => void;
    getAllChats.mockImplementation((_p, userId) =>
      userId
        ? new Promise<AdminConversation[]>((resolve) => {
            resolveSlow = resolve;
          })
        : Promise.resolve([chat("31", "9", "Bob", "Everyone chat")]),
    );
    renderAdmin(`/admin?tab=chats&user_id=${ALICE.id}`);

    await u.click(await screen.findByRole("button", { name: "Xoá bộ lọc người dùng" }));
    expect(await screen.findByText("Everyone chat")).toBeInTheDocument();

    await act(async () => resolveSlow([chat("32", ALICE.id, "Alice", "Stale Alice chat")]));

    expect(screen.getByText("Everyone chat")).toBeInTheDocument();
    expect(screen.queryByText("Stale Alice chat")).not.toBeInTheDocument();
  });
});

describe("Admin user editor", () => {
  it("updates the signed-in account when an admin edits their own display name", async () => {
    const u = userEvent.setup();
    const self = user("1", "Admin");
    getUsers.mockImplementation(async () => [self]);
    updateUser.mockResolvedValue({ ...self, display_name: "Boss" });
    renderAdmin("/admin?tab=users&user_id=1");

    const input = await screen.findByLabelText("Tên hiển thị");
    await u.clear(input);
    await u.type(input, "Boss");
    await u.click(screen.getByRole("button", { name: "Lưu" }));

    await waitFor(() => expect(setMe).toHaveBeenCalledWith(expect.objectContaining({ id: "1", display_name: "Boss" })));
  });

  it("does not touch the signed-in account when editing someone else", async () => {
    const u = userEvent.setup();
    updateUser.mockResolvedValue({ ...ALICE, display_name: "Ali" });
    renderAdmin(`/admin?tab=users&user_id=${ALICE.id}`);

    const input = await screen.findByLabelText("Tên hiển thị");
    await u.clear(input);
    await u.type(input, "Ali");
    await u.click(screen.getByRole("button", { name: "Lưu" }));

    await waitFor(() => expect(updateUser).toHaveBeenCalled());
    expect(setMe).not.toHaveBeenCalled();
  });

  it("shows the name the server settled on after a blank (cleared) save", async () => {
    const u = userEvent.setup();
    updateUser.mockResolvedValue({ ...ALICE, display_name: "Alice" });
    getUsers.mockImplementation(async (_p, id) => (id ? [{ ...ALICE, display_name: "Custom" }] : []));
    renderAdmin(`/admin?tab=users&user_id=${ALICE.id}`);

    const input = await screen.findByLabelText("Tên hiển thị");
    expect(input).toHaveValue("Custom");
    await u.clear(input);
    await u.click(screen.getByRole("button", { name: "Lưu" }));

    await waitFor(() => expect(input).toHaveValue("Alice"));
  });

  it("edits the display name only and sends display_name, never name", async () => {
    const u = userEvent.setup();
    updateUser.mockResolvedValue({ ...ALICE, display_name: "Ali" });
    renderAdmin(`/admin?tab=users&user_id=${ALICE.id}`);

    const input = await screen.findByLabelText("Tên hiển thị");
    await u.clear(input);
    await u.type(input, "Ali");
    await u.click(screen.getByRole("button", { name: "Lưu" }));

    await waitFor(() => expect(updateUser).toHaveBeenCalledWith(ALICE.id, { display_name: "Ali" }));
    expect(Object.keys(updateUser.mock.calls[0][1])).not.toContain("name");
  });

  it("clears the custom name by sending null for a blank value", async () => {
    const u = userEvent.setup();
    updateUser.mockResolvedValue(ALICE);
    renderAdmin(`/admin?tab=users&user_id=${ALICE.id}`);

    await u.clear(await screen.findByLabelText("Tên hiển thị"));
    await u.click(screen.getByRole("button", { name: "Lưu" }));

    await waitFor(() => expect(updateUser).toHaveBeenCalledWith(ALICE.id, { display_name: null }));
  });

  it("opens the details when a name in the users list is clicked", async () => {
    const u = userEvent.setup();
    getUsers.mockImplementation(async () => [ALICE]);
    renderAdmin("/admin?tab=users");

    await u.click(await screen.findByRole("button", { name: "Alice" }));

    expect(screen.getByTestId("url")).toHaveTextContent(`user_id=${ALICE.id}`);
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
  });

  it("says so when the user cannot be found", async () => {
    renderAdmin("/admin?tab=users&user_id=123");
    expect(await screen.findByText("Không tìm thấy người dùng này.")).toBeInTheDocument();
  });
});