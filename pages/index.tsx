import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { Scale, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useAuth } from '@/contexts/AuthContext';

export default function Home() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  return (
    <>
      <Head>
        <title>VeroScale</title>
        <meta name="description" content="Material weight management system" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-gradient-to-b from-primary-950 to-primary-800 text-white">
        <div className="container mx-auto px-4">
          <header className="flex justify-between items-center py-8">
            <div className="flex items-center">
              <Scale className="h-8 w-8 mr-2" />
              <h1 className="text-2xl font-bold">VeroScale</h1>
            </div>
            <div>
              <Button
                onClick={() => router.push('/login')}
                variant="secondary"
                className="mr-2"
              >
                Login
              </Button>
            </div>
          </header>

          <main className="py-20">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6 animate-slide-up">
                <h2 className="text-5xl font-bold leading-tight">
                  Advanced Material Weight Management System
                </h2>
                <p className="text-xl text-gray-300">
                  Track, analyze, and manage material weights with precision and efficiency.
                  Our comprehensive solution provides real-time monitoring and data-driven insights.
                </p>
                <div className="pt-4">
                  <Button
                    onClick={() => router.push('/login')}
                    className="bg-secondary-600 hover:bg-secondary-700 text-white px-8 py-3 rounded-md text-lg font-medium inline-flex items-center"
                  >
                    Get Started <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                {[
                  {
                    title: 'Weight Tracking',
                    description: 'Record and track material weights with precision',
                  },
                  {
                    title: 'Data Analytics',
                    description: 'Gain insights with comprehensive data visualization',
                  },
                  {
                    title: 'User Management',
                    description: 'Role-based access control with secure authentication',
                  },
                  {
                    title: 'Reporting',
                    description: 'Generate detailed reports for data analysis',
                  },
                ].map((feature, index) => (
                  <Card
                    key={index}
                    className="bg-white/10 backdrop-blur-lg border-white/20 text-white hover:bg-white/15 transition-all duration-300 animate-fade-in"
                    animate={true}
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xl">{feature.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-300">{feature.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </main>

          <footer className="py-8 text-center text-gray-400 border-t border-white/10">
            <p>© 2025 VeroScale. All rights reserved.</p>
          </footer>
        </div>
      </div>
    </>
  );
}