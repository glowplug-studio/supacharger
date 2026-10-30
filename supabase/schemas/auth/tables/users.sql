CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION sc_app.handle_auth_user_profile();

CREATE TRIGGER on_auth_user_created_role
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION sc_app.handle_auth_user_role();

CREATE TRIGGER on_auth_user_email_updated_profile
  AFTER UPDATE OF email ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION sc_app.handle_auth_user_profile();
