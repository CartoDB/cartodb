import UserModel from 'dashboard/data/user-model';

export default function createUserModel (attributes, options) {
  return new UserModel(attributes, options);
}
