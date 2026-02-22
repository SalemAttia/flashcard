/**
 * Maps Firebase Auth error codes to user-friendly messages.
 */
export function getFriendlyAuthError(error: any): string {
    const code = error?.code || "";

    switch (code) {
        // Login & General
        case "auth/invalid-email":
            return "The email address is not valid.";
        case "auth/user-disabled":
            return "This user account has been disabled.";
        case "auth/user-not-found":
        case "auth/wrong-password":
        case "auth/invalid-credential":
            return "Invalid email or password. Please try again.";

        // Registration
        case "auth/email-already-in-use":
            return "This email is already in use by another account.";
        case "auth/operation-not-allowed":
            return "Email/password accounts are not enabled. Contact support.";
        case "auth/weak-password":
            return "The password is too weak. Please use at least 6 characters.";

        // Other
        case "auth/network-request-failed":
            return "Network error. Please check your internet connection.";
        case "auth/too-many-requests":
            return "Too many failed attempts. Please try again later.";

        default:
            return "An unexpected error occurred. Please try again.";
    }
}
