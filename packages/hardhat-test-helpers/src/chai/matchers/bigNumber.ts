import {BigNumber} from 'ethers';
import BN from "bn.js";

export function supportBigNumber(
  Assertion: Chai.AssertionStatic,
  utils: Chai.ChaiUtils
) {
  Assertion.overwriteMethod('equals', override('eq', 'equal', utils));
  Assertion.overwriteMethod('equal', override('eq', 'equal', utils));
  Assertion.overwriteMethod('eq', override('eq', 'equal', utils));

  Assertion.overwriteMethod('above', override('gt', 'above', utils));
  Assertion.overwriteMethod('gt', override('gt', 'greater than', utils));

  Assertion.overwriteMethod('below', override('lt', 'below', utils));
  Assertion.overwriteMethod('lt', override('lt', 'less than', utils));

  Assertion.overwriteMethod('least', override('gte', 'at least', utils));
  Assertion.overwriteMethod(
    'gte',
    override('gte', 'greater than or equal', utils)
  );

  Assertion.overwriteMethod('most', override('lte', 'at most', utils));
  Assertion.overwriteMethod(
    'lte',
    override('lte', 'less than or equal', utils)
  );

  Assertion.overwriteMethod('within', overrideWithin(utils));

  Assertion.overwriteMethod('closeTo', overrideCloseTo(utils));
}

type Methods = 'eq' | 'gt' | 'lt' | 'gte' | 'lte';

function override(method: Methods, name: string, utils: Chai.ChaiUtils) {
  return (_super: (...args: any[]) => any) =>
    overwriteBigNumberFunction(method, name, _super, utils);
}

function normalizeToBigNumber(source: BigNumber | BN | number | string): BigNumber {
  if (BigNumber.isBigNumber(source)) {
    return source;
  } else if (BN.isBN(source)) {
    return BigNumber.from(source.toString());
  } else if (typeof source === "string" || typeof source === "number") {
    return BigNumber.from(source)
  } else {
    throw new Error(`cannot convert ${typeof source} to BigNumber`);
  }
}

function isBigNumber(source: any): boolean {
  return BigNumber.isBigNumber(source) || BN.isBN(source);
}

function overwriteBigNumberFunction(
  functionName: Methods,
  readableName: string,
  _super: (...args: any[]) => any,
  chaiUtils: Chai.ChaiUtils
) {
  return function (this: Chai.AssertionStatic, ...args: any[]) {
    const [actual] = args;
    const expected = chaiUtils.flag(this, 'object');
    if (chaiUtils.flag(this, 'doLength') && BigNumber.isBigNumber(actual)) {
      _super.apply(this, [actual.toNumber()]);
      return;
    }
    if (BigNumber.isBigNumber(expected) || BigNumber.isBigNumber(actual) || BN.isBN(expected) || BN.isBN(actual)) {
      const expectedAsBigNumber = (() => {
        if (BigNumber.isBigNumber(expected)) {
          return expected;
        } else if (BN.isBN(expected)) {
          return BigNumber.from(expected.toString());
        } else {
          return BigNumber.from(expected)
        }
      })();
      const actualAsBigNumber = (() => {
        if (BigNumber.isBigNumber(actual)) {
          return actual;
        } else if (BN.isBN(actual)) {
          return BigNumber.from(actual.toString());
        } else {
          return BigNumber.from(actual)
        }
      })();
      this.assert(
        BigNumber.from(expectedAsBigNumber)[functionName](actualAsBigNumber),
        `Expected "${expectedAsBigNumber}" to be ${readableName} ${actualAsBigNumber}`,
        `Expected "${expectedAsBigNumber}" NOT to be ${readableName} ${actualAsBigNumber}`,
        expectedAsBigNumber,
        actualAsBigNumber
      );
    } else {
      _super.apply(this, args);
    }
  };
}

function overrideWithin(utils: Chai.ChaiUtils) {
  return (_super: (...args: any[]) => any) => overwriteBigNumberWithin(_super, utils);
}

function overwriteBigNumberWithin(_super: (...args: any[]) => any, chaiUtils: Chai.ChaiUtils) {
  return function (this: Chai.AssertionStatic, ...args: any[]) {
    const [start, finish] = args;
    const expected = chaiUtils.flag(this, 'object');
    if (isBigNumber(expected) || isBigNumber(start) || isBigNumber(finish)) {
      const expectedAsBigNumber = normalizeToBigNumber(expected);
      const startAsBigNumber = normalizeToBigNumber(start);
      const finishAsBigNumber = normalizeToBigNumber(finish);
      this.assert(
        BigNumber.from(startAsBigNumber).lte(expectedAsBigNumber) && BigNumber.from(finishAsBigNumber).gte(expectedAsBigNumber),
        `Expected "${expectedAsBigNumber}" to be within [${[startAsBigNumber, finishAsBigNumber]}]`,
        `Expected "${expectedAsBigNumber}" NOT to be within [${[startAsBigNumber, finishAsBigNumber]}]`,
        [startAsBigNumber, finishAsBigNumber],
        expectedAsBigNumber
      );
    } else {
      _super.apply(this, args);
    }
  };
}

function overrideCloseTo(utils: Chai.ChaiUtils) {
  return (_super: (...args: any[]) => any) =>
    overwriteBigNumberCloseTo(_super, utils);
}

function overwriteBigNumberCloseTo(_super: (...args: any[]) => any, chaiUtils: Chai.ChaiUtils) {
  return function (this: Chai.AssertionStatic, ...args: any[]) {
    const [actual, delta] = args;
    const expected = chaiUtils.flag(this, 'object');
    if (BigNumber.isBigNumber(expected) || BigNumber.isBigNumber(actual) || BigNumber.isBigNumber(delta)) {
      this.assert(
        BigNumber.from(expected).sub(actual).abs().lte(delta),
        `Expected "${expected}" to be within ${delta} of ${actual}`,
        `Expected "${expected}" NOT to be within ${delta} of ${actual}`,
        `A number between ${actual.sub(delta)} and ${actual.sub(delta)}`,
        expected
      );
    } else {
      _super.apply(this, args);
    }
  };
}