import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api-response", () => ({
  ok: vi.fn((data: unknown, status = 200) => ({ success: true, data, status })),
}));

vi.mock("@/modules/incident/incident.service", () => ({
  listIncidents: vi.fn(),
  createIncident: vi.fn(),
  getIncidentById: vi.fn(),
  updateIncidentById: vi.fn(),
  deleteIncidentById: vi.fn(),
}));

vi.mock("@/modules/team/team.service", () => ({
  listTeams: vi.fn(),
  createTeam: vi.fn(),
  getTeamById: vi.fn(),
  updateTeamById: vi.fn(),
  deleteTeamById: vi.fn(),
}));

vi.mock("@/modules/user/user.service", () => ({
  listUsers: vi.fn(),
  createUser: vi.fn(),
  registerUser: vi.fn(),
  getUserById: vi.fn(),
  updateUserById: vi.fn(),
  deleteUserById: vi.fn(),
}));

vi.mock("@/modules/product/product.service", () => ({
  listProducts: vi.fn(),
  createProduct: vi.fn(),
  getProductById: vi.fn(),
  updateProductById: vi.fn(),
  deleteProductById: vi.fn(),
}));

import { ok } from "@/lib/api-response";
import {
  createIncidentController,
  deleteIncidentByIdController,
  getIncidentByIdController,
  listIncidentsController,
  updateIncidentByIdController,
} from "@/modules/incident/incident.controller";
import * as incidentService from "@/modules/incident/incident.service";

import {
  createTeamController,
  deleteTeamByIdController,
  getTeamByIdController,
  listTeamsController,
  updateTeamByIdController,
} from "@/modules/team/team.controller";
import * as teamService from "@/modules/team/team.service";

import {
  createUserController,
  deleteUserByIdController,
  getUserByIdController,
  listUsersController,
  registerUserController,
  updateUserByIdController,
} from "@/modules/user/user.controller";
import * as userService from "@/modules/user/user.service";

import {
  createProductController,
  deleteProductByIdController,
  getProductByIdController,
  listProductsController,
  updateProductByIdController,
} from "@/modules/product/product.controller";
import * as productService from "@/modules/product/product.service";

const INCIDENT_ID = "inc-001";
const TEAM_ID = "team-001";
const USER_ID = "user-001";
const PRODUCT_ID = "prod-001";

function fakeIncident(overrides = {}) {
  return { id: INCIDENT_ID, title: "Test Incident", ...overrides };
}
function fakeTeam(overrides = {}) {
  return { id: TEAM_ID, name: "Engineering", ...overrides };
}
function fakeUser(overrides = {}) {
  return { id: USER_ID, email: "user@example.com", name: "Test User", ...overrides };
}
function fakeProduct(overrides = {}) {
  return { id: PRODUCT_ID, name: "Widget", price: 9.99, ...overrides };
}

// ---- incident.controller ----

describe("incident.controller — listIncidentsController", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls listIncidents and returns ok response", async () => {
    const incidents = [fakeIncident()];
    vi.mocked(incidentService.listIncidents).mockResolvedValue(incidents as never);

    const result = await listIncidentsController();

    expect(incidentService.listIncidents).toHaveBeenCalledOnce();
    expect(ok).toHaveBeenCalledWith(incidents);
    expect(result).toMatchObject({ success: true, data: incidents, status: 200 });
  });
});

describe("incident.controller — createIncidentController", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls createIncident with input and user info, returns 201", async () => {
    const incident = fakeIncident();
    vi.mocked(incidentService.createIncident).mockResolvedValue(incident as never);

    const input = {
      teamId: 1,
      title: "Test Incident",
      description: "Desc",
      severity: "Low" as const,
      assignedBy: "u1",
      assignedTo: "u2",
    };

    const result = await createIncidentController(input, "user-1", "Alice");

    expect(incidentService.createIncident).toHaveBeenCalledWith(input, "user-1", "Alice");
    expect(ok).toHaveBeenCalledWith(incident, 201);
    expect(result).toMatchObject({ status: 201 });
  });
});

describe("incident.controller — getIncidentByIdController", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls getIncidentById and returns ok response", async () => {
    const incident = fakeIncident();
    vi.mocked(incidentService.getIncidentById).mockResolvedValue(incident as never);

    const result = await getIncidentByIdController(INCIDENT_ID);

    expect(incidentService.getIncidentById).toHaveBeenCalledWith(INCIDENT_ID);
    expect(result).toMatchObject({ success: true, data: incident });
  });
});

describe("incident.controller — updateIncidentByIdController", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls updateIncidentById and returns ok response", async () => {
    const updated = fakeIncident({ title: "Updated" });
    vi.mocked(incidentService.updateIncidentById).mockResolvedValue(updated as never);

    const input = { title: "Updated" };
    const result = await updateIncidentByIdController(INCIDENT_ID, input, "user-1", "Alice");

    expect(incidentService.updateIncidentById).toHaveBeenCalledWith(INCIDENT_ID, input, "user-1", "Alice");
    expect(result).toMatchObject({ success: true, data: updated });
  });
});

describe("incident.controller — deleteIncidentByIdController", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls deleteIncidentById and returns deleted:true", async () => {
    vi.mocked(incidentService.deleteIncidentById).mockResolvedValue(undefined as never);

    const result = await deleteIncidentByIdController(INCIDENT_ID, "user-1", "Alice");

    expect(incidentService.deleteIncidentById).toHaveBeenCalledWith(INCIDENT_ID, "user-1", "Alice");
    expect(ok).toHaveBeenCalledWith({ deleted: true });
    expect(result).toMatchObject({ success: true, data: { deleted: true } });
  });
});

// ---- team.controller ----

describe("team.controller — listTeamsController", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls listTeams with userId and returns ok", async () => {
    const teams = [fakeTeam()];
    vi.mocked(teamService.listTeams).mockResolvedValue(teams as never);

    const result = await listTeamsController(USER_ID);

    expect(teamService.listTeams).toHaveBeenCalledWith(USER_ID);
    expect(result).toMatchObject({ success: true, data: teams });
  });
});

describe("team.controller — createTeamController", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls createTeam and returns 201", async () => {
    const team = fakeTeam();
    vi.mocked(teamService.createTeam).mockResolvedValue(team as never);

    const input = { name: "Engineering", isActive: true, memberIds: [] };
    const result = await createTeamController(input);

    expect(teamService.createTeam).toHaveBeenCalledWith(input);
    expect(result).toMatchObject({ status: 201, data: team });
  });
});

describe("team.controller — getTeamByIdController", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls getTeamById and returns ok", async () => {
    const team = fakeTeam();
    vi.mocked(teamService.getTeamById).mockResolvedValue(team as never);

    const result = await getTeamByIdController(TEAM_ID);

    expect(teamService.getTeamById).toHaveBeenCalledWith(TEAM_ID);
    expect(result).toMatchObject({ success: true, data: team });
  });
});

describe("team.controller — updateTeamByIdController", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls updateTeamById and returns ok", async () => {
    const updated = fakeTeam({ name: "New Name" });
    vi.mocked(teamService.updateTeamById).mockResolvedValue(updated as never);

    const input = { name: "New Name" };
    const result = await updateTeamByIdController(TEAM_ID, input);

    expect(teamService.updateTeamById).toHaveBeenCalledWith(TEAM_ID, input);
    expect(result).toMatchObject({ data: updated });
  });
});

describe("team.controller — deleteTeamByIdController", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls deleteTeamById and returns deleted:true", async () => {
    vi.mocked(teamService.deleteTeamById).mockResolvedValue(undefined as never);

    const result = await deleteTeamByIdController(TEAM_ID);

    expect(teamService.deleteTeamById).toHaveBeenCalledWith(TEAM_ID);
    expect(result).toMatchObject({ data: { deleted: true } });
  });
});

// ---- user.controller ----

describe("user.controller — listUsersController", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls listUsers and returns ok", async () => {
    const users = [fakeUser()];
    vi.mocked(userService.listUsers).mockResolvedValue(users as never);

    const result = await listUsersController();

    expect(userService.listUsers).toHaveBeenCalledOnce();
    expect(result).toMatchObject({ success: true, data: users });
  });
});

describe("user.controller — createUserController", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls createUser and returns 201", async () => {
    const user = fakeUser();
    vi.mocked(userService.createUser).mockResolvedValue(user as never);

    const input = { email: "user@example.com", name: "Test User", password: "password123" };
    const result = await createUserController(input);

    expect(userService.createUser).toHaveBeenCalledWith(input);
    expect(result).toMatchObject({ status: 201, data: user });
  });
});

describe("user.controller — registerUserController", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls registerUser and returns 201", async () => {
    const user = fakeUser();
    vi.mocked(userService.registerUser).mockResolvedValue(user as never);

    const input = { email: "user@example.com", name: "Test User", password: "password123" };
    const result = await registerUserController(input);

    expect(userService.registerUser).toHaveBeenCalledWith(input);
    expect(result).toMatchObject({ status: 201, data: user });
  });
});

describe("user.controller — getUserByIdController", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls getUserById and returns ok", async () => {
    const user = fakeUser();
    vi.mocked(userService.getUserById).mockResolvedValue(user as never);

    const result = await getUserByIdController(USER_ID);

    expect(userService.getUserById).toHaveBeenCalledWith(USER_ID);
    expect(result).toMatchObject({ success: true, data: user });
  });
});

describe("user.controller — updateUserByIdController", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls updateUserById and returns ok", async () => {
    const updated = fakeUser({ name: "New Name" });
    vi.mocked(userService.updateUserById).mockResolvedValue(updated as never);

    const input = { name: "New Name" };
    const result = await updateUserByIdController(USER_ID, input);

    expect(userService.updateUserById).toHaveBeenCalledWith(USER_ID, input);
    expect(result).toMatchObject({ data: updated });
  });
});

describe("user.controller — deleteUserByIdController", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls deleteUserById and returns deleted:true", async () => {
    vi.mocked(userService.deleteUserById).mockResolvedValue(undefined as never);

    const result = await deleteUserByIdController(USER_ID);

    expect(userService.deleteUserById).toHaveBeenCalledWith(USER_ID);
    expect(result).toMatchObject({ data: { deleted: true } });
  });
});

// ---- product.controller ----

describe("product.controller — listProductsController", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls listProducts and returns ok", async () => {
    const products = [fakeProduct()];
    vi.mocked(productService.listProducts).mockResolvedValue(products as never);

    const result = await listProductsController();

    expect(productService.listProducts).toHaveBeenCalledOnce();
    expect(result).toMatchObject({ success: true, data: products });
  });
});

describe("product.controller — createProductController", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls createProduct and returns 201", async () => {
    const product = fakeProduct();
    vi.mocked(productService.createProduct).mockResolvedValue(product as never);

    const input = { name: "Widget", price: 9.99 };
    const result = await createProductController(input);

    expect(productService.createProduct).toHaveBeenCalledWith(input);
    expect(result).toMatchObject({ status: 201, data: product });
  });
});

describe("product.controller — getProductByIdController", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls getProductById and returns ok", async () => {
    const product = fakeProduct();
    vi.mocked(productService.getProductById).mockResolvedValue(product as never);

    const result = await getProductByIdController(PRODUCT_ID);

    expect(productService.getProductById).toHaveBeenCalledWith(PRODUCT_ID);
    expect(result).toMatchObject({ success: true, data: product });
  });
});

describe("product.controller — updateProductByIdController", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls updateProductById and returns ok", async () => {
    const updated = fakeProduct({ name: "Super Widget" });
    vi.mocked(productService.updateProductById).mockResolvedValue(updated as never);

    const input = { name: "Super Widget" };
    const result = await updateProductByIdController(PRODUCT_ID, input);

    expect(productService.updateProductById).toHaveBeenCalledWith(PRODUCT_ID, input);
    expect(result).toMatchObject({ data: updated });
  });
});

describe("product.controller — deleteProductByIdController", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls deleteProductById and returns deleted:true", async () => {
    vi.mocked(productService.deleteProductById).mockResolvedValue(undefined as never);

    const result = await deleteProductByIdController(PRODUCT_ID);

    expect(productService.deleteProductById).toHaveBeenCalledWith(PRODUCT_ID);
    expect(result).toMatchObject({ data: { deleted: true } });
  });
});
