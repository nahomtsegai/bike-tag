import { assertAdminRequestAccess } from "../../../utils/adminAuth";

export default defineEventHandler(async (event) => {
  try {
    const adminAccess = await assertAdminRequestAccess(event);

    return {
      isAuthenticated: true,
      authType: "supabase",
      adminUser: {
        id: adminAccess.adminUser.id,
        email: adminAccess.adminUser.email,
        displayName: adminAccess.adminUser.display_name,
      },
    };
  } catch {
    return {
      isAuthenticated: false,
      authType: null,
      adminUser: null,
    };
  }
});
