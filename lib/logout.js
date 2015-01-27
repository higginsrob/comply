module.exports = function logout(ctx) {
  if(ctx.session) delete ctx.session.uid;
  if(ctx.state) delete ctx.state.user;
};