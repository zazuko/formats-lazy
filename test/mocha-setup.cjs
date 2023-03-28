const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
require('chai-snapshot-matcher')
const sinonChai = require('sinon-chai')

chai.use(chaiAsPromised)
chai.use(sinonChai)
