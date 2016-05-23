/* eslint-env mocha */
/* eslint-disable func-names */
/* eslint-disable prefer-arrow-callback */
import './config.env';
import R from 'ramda';
import util from 'util';
import { expect } from 'chai';
import { HpeApi, HpeApiPipeline } from 'cf-hpe-api';

describe('HpeApi', function () {
  this.slow(5000);
  this.timeout(15000);

  this.session = null;
  this.buildSession = null;
  this.ciServerId = null;
  this.ciServerHpeId = null;
  this.pipelineId = null;
  this.buildStartTime = null;

  function reportPipelineStepStatusHelper(stepId, status, result, done) {
    const stepStatus = {
      stepId,
      ciServerId: this.ciServerId,
      pipelineId: this.pipelineId,
      buildId: this.rootJobBuildId,
      startTime: this.rootJobStartTime,
      duration: Date.now() - this.rootJobStartTime,
      status,
      result,
    };

    HpeApi
      .reportPipelineStepStatus(this.session, stepStatus)
      .subscribe(
        () => done(),
        error => done(error));
  }

  it('Should create a session', function (done) {
    HpeApi
      .createSession()
      .subscribe(
        session => {
          this.session = session;
          done();
        },
        error => done(error));
  });

  it('Should create a CI server', function (done) {
    const ciServerName = util.format('Codefresh %d', Date.now());
    const ciServerId = R.toLower(ciServerName);

    HpeApi
      .createCiServer(this.session, ciServerId, ciServerName)
      .subscribe(
        response => {
          expect(response.id).to.be.a('number');
          expect(response.instance_id).to.equal(ciServerId);
          expect(response.name).to.equal(ciServerName);
          expect(response.server_type).to.equal('Codefresh');

          this.ciServerId = ciServerId;
          this.ciServerHpeId = response.id;
          done();
        },
        error => done(error));
  });

  it('Should find a CI server', function (done) {
    HpeApi
      .findCiServer(this.session, this.ciServerId)
      .subscribe(
        response => {
          expect(response.id).to.be.a('number');
          expect(response.instance_id).to.equal(this.ciServerId);
          done();
        },
        error => done(error));
  });

  it('Should create a CI server pipeline ', function (done) {
    const pipelineName = util.format('Pipeline %d', Date.now());
    const pipelineId = R.toLower(pipelineName);

    HpeApi
      .createPipeline(this.session, this.ciServerHpeId, pipelineId, pipelineName)
      .subscribe(
        response => {
          expect(response.id).to.be.a('number');
          expect(response.root_job.id).to.be.a('number');
          expect(response.ci_server.id).to.equal(this.ciServerHpeId);
          expect(response.name).to.equal(pipelineName);

          const pipelineJobs = HpeApiPipeline.jobs(pipelineId);
          expect(response.root_job_ci_id).to.equal(pipelineJobs[0].jobCiId);
          expect(response.jobs[0].jobCiId).to.equal(pipelineJobs[0].jobCiId);
          expect(response.jobs[1].jobCiId).to.equal(pipelineJobs[1].jobCiId);
          expect(response.jobs[2].jobCiId).to.equal(pipelineJobs[2].jobCiId);
          expect(response.jobs[3].jobCiId).to.equal(pipelineJobs[3].jobCiId);
          expect(response.jobs[4].jobCiId).to.equal(pipelineJobs[4].jobCiId);
          expect(response.jobs[5].jobCiId).to.equal(pipelineJobs[5].jobCiId);
          expect(response.jobs[6].jobCiId).to.equal(pipelineJobs[6].jobCiId);
          expect(response.jobs[7].jobCiId).to.equal(pipelineJobs[7].jobCiId);

          this.pipelineId = pipelineId;
          done();
        },
        error => done(error));
  });

  it('Should create build session', function () {
    const buildName = util.format('Build %d', Date.now());
    const buildId = R.toLower(buildName);

    this.buildSession = HpeApi.createBuildSession(
      this.session,
      this.ciServerId,
      this.pipelineId,
      buildId,
      buildName
    );
  });

  it('Should report pipeline status as "running"', function (done) {
    const buildStartTime = Date.now();

    HpeApi
      .reportBuildPipelineStepStatus(
        this.buildSession,
        'pipeline',
        buildStartTime,
        0,
        'running',
        'unavailable')
      .subscribe(
        () => {
          this.buildStartTime = buildStartTime;
          done();
        },
        error => done(error));
  });

//  it('Should report pipeline step "clone-repository" status as "finished"', function (done) {
//    reportPipelineStepStatusHelper('clone-repository', 'finished', 'success', done);
//  });
//
//  it('Should report pipeline step "build-dockerfile" status as "finished"', function (done) {
//    reportPipelineStepStatusHelper('build-dockerfile', 'finished', 'success', done);
//  });
//
//  it('Should report pipeline step "unit-test-script" status as "finished"', function (done) {
//    reportPipelineStepStatusHelper('unit-test-script', 'finished', 'success', done);
//  });
//
//  it('Should report pipeline step "push-docker-registry" status as "finished"', function (done) {
//    reportPipelineStepStatusHelper('push-docker-registry', 'finished', 'success', done);
//  });
//
//  it('Should report pipeline step "integration-test-script" status as "finished"', function (done) {
//    reportPipelineStepStatusHelper('integration-test-script', 'finished', 'success', done);
//  });
//
//  it('Should report pipeline step "security-validation" status as "finished"', function (done) {
//    reportPipelineStepStatusHelper('security-validation', 'finished', 'success', done);
//  });
//
//  it('Should report pipeline step "deploy-script" status as "finished"', function (done) {
//    reportPipelineStepStatusHelper('deploy-script', 'finished', 'success', done);
//  });
//
//  it('Should publish test success results #1', function (done) {
//    const testResult = {
//      stepId: 'unit-test-script',
//      ciServerId: this.ciServerId,
//      pipelineId: this.pipelineId,
//      buildId: this.rootJobBuildId,
//      testRuns: [
//        {
//          testName: 'Should pass unit test #1',
//          started: Date.now(),
//          duration: 1000,
//          status: 'Passed',
//          package: 'cf-hpe',
//          module: 'test-1',
//          class: 'hpe',
//        },
//      ],
//    };
//
//    HpeApi
//      .reportPipelineTestResults(this.session, testResult)
//      .subscribe(() => done(),
//        error => done(error));
//  });
//
//  it('Should publish test failed results #2', function (done) {
//    const testResult = {
//      stepId: 'unit-test-script',
//      ciServerId: this.ciServerId,
//      pipelineId: this.pipelineId,
//      buildId: this.rootJobBuildId,
//      testRuns: [
//        {
//          testName: 'Should pass unit test #2',
//          started: Date.now(),
//          duration: 1000,
//          status: 'Failed',
//          package: 'cf-hpe',
//          module: 'test-1',
//          class: 'hpe',
//        },
//      ],
//    };
//
//    HpeApi
//      .reportPipelineTestResults(this.session, testResult)
//      .subscribe(() => done(),
//        error => done(error));
//  });
//
//  it('Should publish test success results #3', function (done) {
//    const testResult = {
//      stepId: 'integration-test-script',
//      ciServerId: this.ciServerId,
//      pipelineId: this.pipelineId,
//      buildId: this.rootJobBuildId,
//      testRuns: [
//        {
//          testName: 'Should pass integration test #1',
//          started: Date.now(),
//          duration: 1000,
//          status: 'Passed',
//          package: 'cf-hpe',
//          module: 'test-2',
//          class: 'hpe',
//        },
//      ],
//    };
//
//    HpeApi
//      .reportPipelineTestResults(this.session, testResult)
//      .subscribe(() => done(),
//        error => done(error));
//  });
//
//  it('Should publish test failed results #4', function (done) {
//    const testResult = {
//      stepId: 'integration-test-script',
//      ciServerId: this.ciServerId,
//      pipelineId: this.pipelineId,
//      buildId: this.rootJobBuildId,
//      testRuns: [
//        {
//          testName: 'Should pass integration test #2',
//          started: Date.now(),
//          duration: 1000,
//          status: 'Failed',
//          package: 'cf-hpe',
//          module: 'test-2',
//          class: 'hpe',
//        },
//      ],
//    };
//
//    HpeApi
//      .reportPipelineTestResults(this.session, testResult)
//      .subscribe(() => done(),
//        error => done(error));
//  });

  it('Should report pipeline status as "finished"', function (done) {
    HpeApi
      .reportBuildPipelineStepStatus(
        this.buildSession,
        'pipeline',
        this.buildStartTime,
        Date.now() - this.buildStartTime,
        'finished',
        'success')
      .subscribe(
        () => done(),
        error => done(error));
  });
});
