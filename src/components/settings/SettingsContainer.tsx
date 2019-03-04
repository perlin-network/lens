import * as React from "react";
import { Box } from "@rebass/grid";
import { APIHostConfig } from "../config/APIHostConfig";
import { SectionTitle } from "../common/typography";
import { getCurrentHost } from "../../storage";

import { Card } from "../common/core";

export default class SettingsContainer extends React.Component<{}, {}> {
    public render() {
        const currentHost = getCurrentHost();

        return (
            <>
                <SectionTitle>API host configuration</SectionTitle>
                Current host: {currentHost}
                <Card justifyContent="space-between">
                    <APIHostConfig />
                </Card>
            </>
        );
    }
}
