import { User } from '../models/user.models';

/**
 * The signed-in user. There is no authentication in this assignment, so the user shown in
 * the header and recorded as the actor of changes is fixed to the first mock user.
 */
export const CURRENT_USER: User = {
  id: 'user-001',
  name: 'John Doe',
  avatar: 'JD',
  email: 'john.doe@company.com',
};
