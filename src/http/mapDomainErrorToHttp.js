export function mapDomainErrorToHttp(err) {
  if (err instanceof TypeError || err instanceof RangeError) return 400;
  switch (err?.message) {
    //auth-user
    case "USER_IN_USE":
      return 409;
    case "EMAIL_TAKEN":
      return 409;
    case "INVALID_CREDENTIALS":
      return 401;
    case "AUTH_REPO_UNAVAILABLE":
      return 503;
    case "REFRESH_INVALID":
      return 401;
    case "REFRESH_EXPIRED":
      return 401;
    case "INVALID_TOKEN":
      return 401;
    case "REGISTER_READ_BACK_FAILED":
      return 500;

    //producto
    case "PRODUCT_DUPLICATE":
      return 409;
    case "CATEGORY_NOT_FOUND":
      return 422;
    //movimiento
    case "PRODUCT_IN_USE":
      return 409;
    case "MOV_EXPORT_REPO_UNAVAILABLE":
      return 503;
    // categoría
    case "CATEGORY_DUPLICATE":
      return 409;
    case "CATEGORY_IN_USE":
      return 409;
    default:
      return 500;
  }
}
