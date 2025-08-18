import { useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { Scale, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { useAuth } from "@/contexts/AuthContext";

export default function Home() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push("/dashboard");
    }
  }, [user, router]);

  return (
    <>
      <Head>
        <title>VeroScale</title>
        <meta name="description" content="Material weight management system" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="flex flex-col min-h-screen text-white bg-gradient-to-b from-primary-950 to-primary-800">
        <div className="container px-4 mx-auto">
          <header className="flex items-center justify-between py-8">
            <div className="flex items-center">
              <Scale className="w-8 h-8 mr-2" />
              <h1 className="text-2xl font-bold">VeroScale</h1>
            </div>
            <div>
              <Button
                onClick={() => router.push("/login")}
                variant="secondary"
                className="mr-2"
              >
                Login
              </Button>
            </div>
          </header>

          <main className="flex-1 py-20">
            <div className="grid items-center grid-cols-1 gap-12 lg:grid-cols-2">
              <div className="space-y-6 animate-slide-up">
                <h2 className="text-5xl font-bold leading-tight">
                  Advanced Material Weight Management System
                </h2>
                <p className="text-xl text-gray-300">
                  Track, analyze, and manage material weights with precision and
                  efficiency. Our comprehensive solution provides real-time
                  monitoring and data-driven insights.
                </p>
                <div className="pt-4">
                  <Button
                    onClick={() => router.push("/login")}
                    className="inline-flex items-center px-8 py-3 text-lg font-medium text-white rounded-md bg-secondary-600 hover:bg-secondary-700"
                  >
                    Get Started <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                {[
                  {
                    title: "Weight Tracking",
                    description:
                      "Record and track material weights with precision",
                  },
                  {
                    title: "Data Analytics",
                    description:
                      "Gain insights with comprehensive data visualization",
                  },
                  {
                    title: "User Management",
                    description:
                      "Role-based access control with secure authentication",
                  },
                  {
                    title: "Reporting",
                    description: "Generate detailed reports for data analysis",
                  },
                ].map((feature, index) => (
                  <Card
                    key={index}
                    className="text-white transition-all duration-300 bg-white/10 backdrop-blur-lg border-white/20 hover:bg-white/15 animate-fade-in"
                    animate={true}
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xl text-white">
                        {feature.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-300">{feature.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
