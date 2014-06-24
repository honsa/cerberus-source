/*
 * Cerberus  Copyright (C) 2013  vertigo17
 * DO NOT ALTER OR REMOVE COPYRIGHT NOTICES OR THIS FILE HEADER.
 *
 * This file is part of Cerberus.
 *
 * Cerberus is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Cerberus is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Cerberus.  If not, see <http://www.gnu.org/licenses/>.
 */
package org.cerberus.serviceEngine.impl;

import org.apache.log4j.Level;
import org.cerberus.entity.ExecutionSOAPResponse;
import org.cerberus.entity.ExecutionUUID;
import org.cerberus.entity.MessageGeneral;
import org.cerberus.entity.MessageGeneralEnum;
import org.cerberus.entity.TestCaseExecution;
import org.cerberus.exception.CerberusException;
import org.cerberus.log.MyLogger;
import org.cerberus.serviceEngine.IExecutionRunService;
import org.cerberus.serviceEngine.IExecutionStartService;
import org.cerberus.serviceEngine.IRunTestCaseService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

/**
 * {Insert class description here}
 *
 * @author Tiago Bernardes
 * @version 1.0, 23/01/2013
 * @since 2.0.0
 */
@Service
public class RunTestCaseService implements IRunTestCaseService {

    @Autowired
    private IExecutionStartService executionStartService;
    @Autowired
    private IExecutionRunService executionRunService;
    @Autowired
    private ExecutionUUID executionUUID;
    @Autowired
    private ExecutionSOAPResponse eSResponse;

    @Override
    public TestCaseExecution runTestCase(TestCaseExecution tCExecution) {

        try {
            /**
             * Start Execution (Checks and Creation of ID)
            *
             */
            tCExecution = executionStartService.startExecution(tCExecution);

            /**
             * Execute TestCase in new thread if asynchroneous execution
             */
            if (!tCExecution.isSynchroneous()) {
                tCExecution = executionRunService.executeAsynchroneouslyTestCase(tCExecution);
            } else {
                tCExecution = executionRunService.executeTestCase(tCExecution);
            }
        } catch (CerberusException ex) {
            tCExecution.setResultMessage(ex.getMessageError());
        } finally {
            /**
             * Clean memory (Remove all object put in memory
             */
            try {
                if (executionUUID.getExecutionID(tCExecution.getExecutionUUID()) != null) {
                    executionUUID.removeExecutionUUID(tCExecution.getExecutionUUID());
                }
                if (eSResponse.getExecutionSOAPResponse(tCExecution.getId()) != null) {
                    eSResponse.removeExecutionSOAPResponse(tCExecution.getId());
                }
            } catch (Exception ex) {
                MyLogger.log(RunTestCaseService.class.getName(), Level.FATAL, "Exception cleaning Memory: " + ex.toString());
            }
        }

        return tCExecution;
    }
}
