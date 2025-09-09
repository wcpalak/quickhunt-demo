import React, { Fragment } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../ui/card";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Separator } from "../../ui/separator";
import { Copy, DollarSign, Gift, Mail, Wallet } from "lucide-react";

const Referral = () => {
    return (
        <Fragment>
            <Card className="">
                <CardHeader className="p-5">
                    <CardTitle className="text-xl lg:text-2xl font-semibold">Referrals</CardTitle>
                    <CardDescription>
                        Get paid for recommending Quickhunt to your network.
                    </CardDescription>
                </CardHeader>
                <Separator />
                <CardContent className="p-5 space-y-6">
                    <div className="space-y-1">
                        <h2 className="text-base font-medium">Referral Link</h2>
                        <p className="text-sm text-muted-foreground">
                            Earn up to $1,000 per referral for sharing your unique link.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Input
                            value="https://quickhunt.io/register?referral=ABC123"
                            readOnly
                            className="flex-1"
                        />
                        <Button size="sm" variant="outline">
                            <Copy className="h-4 w-4" />
                        </Button>
                    </div>
                    <div className="border rounded-lg divide-y">
                        <div className="flex gap-3 p-4">
                            <DollarSign className="h-5 w-5 text-primary mt-1" />
                            <div>
                                <h3 className="font-medium">What do I receive?</h3>
                                <p className="text-sm text-muted-foreground">
                                    For every new customer you refer, you’ll receive 20% of their paid
                                    subscription every month (up to $1,000 per referral).
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-3 p-4">
                            <Gift className="h-5 w-5 text-primary mt-1" />
                            <div>
                                <h3 className="font-medium">What do my referrals receive?</h3>
                                <p className="text-sm text-muted-foreground">
                                    Your referrals will get 20% off their monthly plan for 3 months or
                                    5% off their first year of an annual plan.
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-3 p-4">
                            <Mail className="h-5 w-5 text-primary mt-1" />
                            <div>
                                <h3 className="font-medium">How do I track the status of my referral?</h3>
                                <p className="text-sm text-muted-foreground">
                                    You can check the status of each referral below. Once your first
                                    referral becomes a paid customer, you’ll get an email with instructions.
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-3 p-4">
                            <Wallet className="h-5 w-5 text-primary mt-1" />
                            <div>
                                <h3 className="font-medium">How do I get paid?</h3>
                                <p className="text-sm text-muted-foreground">
                                    Rewards will be distributed via PayPal. Payouts will take up to 90 days.
                                </p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </Fragment>
    )
}

export default Referral;
